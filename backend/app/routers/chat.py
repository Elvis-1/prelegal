import json
import logging
import re

from fastapi import APIRouter, Depends, HTTPException, status
from litellm import completion
from pydantic import BaseModel

from app.auth import get_current_user
from app.config import settings
from app.schemas import ChatRequest, ChatResponse, NDAFields, PartyFields

logger = logging.getLogger(__name__)

router = APIRouter()

MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}

SYSTEM_PROMPT = """You are a friendly legal assistant helping users fill in a Mutual Non-Disclosure Agreement (MNDA).

Your goal is to collect all required fields through natural, professional conversation. Ask about 1-2 related fields at a time. Briefly explain what each field means if it might be unclear.

Fields to collect:
- purpose: What confidential information will be used for (e.g. "evaluating a potential partnership")
- effectiveDate: Start date (YYYY-MM-DD format)
- mndaTermType: "expires" (fixed duration) or "continues" (until terminated)
- mndaTermYears: Number of years as a string (only if mndaTermType is "expires")
- confidentialityTermType: "years" (time-limited) or "perpetuity" (forever)
- confidentialityTermYears: Number of years as a string (only if confidentialityTermType is "years")
- governingLaw: US state whose laws govern the agreement
- jurisdiction: City/county and state for courts (e.g. "New Castle, DE")
- modifications: Any changes to standard terms — if none, use "None."
- party1.company, party1.name, party1.title, party1.noticeAddress
- party2.company, party2.name, party2.title, party2.noticeAddress

RESPONSE FORMAT — always respond with valid JSON only, no markdown:
{
  "reply": "Your conversational message",
  "fields": {
    "purpose": "",
    "effectiveDate": "",
    "mndaTermType": "expires",
    "mndaTermYears": "1",
    "confidentialityTermType": "years",
    "confidentialityTermYears": "1",
    "governingLaw": "",
    "jurisdiction": "",
    "modifications": "",
    "party1": {"company": "", "name": "", "title": "", "noticeAddress": ""},
    "party2": {"company": "", "name": "", "title": "", "noticeAddress": ""}
  },
  "is_complete": false
}

Rules:
- In "fields", carry forward ALL currently known values plus any new values extracted from the user's message.
- Set "is_complete" to true only when every field has a non-empty value (modifications may be "None.").
- When is_complete is true, congratulate the user and tell them to download the PDF using the button above.
- Never ask for information already provided.
- Use a warm, professional tone."""


class LLMResponse(BaseModel):
    reply: str
    fields: dict
    is_complete: bool


def _fields_to_dict(fields: NDAFields) -> dict:
    return {
        "purpose": fields.purpose,
        "effectiveDate": fields.effectiveDate,
        "mndaTermType": fields.mndaTermType,
        "mndaTermYears": fields.mndaTermYears,
        "confidentialityTermType": fields.confidentialityTermType,
        "confidentialityTermYears": fields.confidentialityTermYears,
        "governingLaw": fields.governingLaw,
        "jurisdiction": fields.jurisdiction,
        "modifications": fields.modifications,
        "party1": {
            "company": fields.party1.company,
            "name": fields.party1.name,
            "title": fields.party1.title,
            "noticeAddress": fields.party1.noticeAddress,
        },
        "party2": {
            "company": fields.party2.company,
            "name": fields.party2.name,
            "title": fields.party2.title,
            "noticeAddress": fields.party2.noticeAddress,
        },
    }


def _dict_to_fields(data: dict) -> NDAFields:
    p1 = data.get("party1", {})
    p2 = data.get("party2", {})
    return NDAFields(
        purpose=data.get("purpose", ""),
        effectiveDate=data.get("effectiveDate", ""),
        mndaTermType=data.get("mndaTermType", "expires"),
        mndaTermYears=data.get("mndaTermYears", "1"),
        confidentialityTermType=data.get("confidentialityTermType", "years"),
        confidentialityTermYears=data.get("confidentialityTermYears", "1"),
        governingLaw=data.get("governingLaw", ""),
        jurisdiction=data.get("jurisdiction", ""),
        modifications=data.get("modifications", ""),
        party1=PartyFields(
            company=p1.get("company", ""),
            name=p1.get("name", ""),
            title=p1.get("title", ""),
            noticeAddress=p1.get("noticeAddress", ""),
        ),
        party2=PartyFields(
            company=p2.get("company", ""),
            name=p2.get("name", ""),
            title=p2.get("title", ""),
            noticeAddress=p2.get("noticeAddress", ""),
        ),
    )


@router.post("/message", response_model=ChatResponse)
def chat_message(request: ChatRequest, _user=Depends(get_current_user)):
    if not settings.openrouter_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service not configured",
        )

    current_fields_dict = _fields_to_dict(request.current_fields)

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "system",
            "content": f"Current NDA fields: {json.dumps(current_fields_dict)}",
        },
    ]
    for msg in request.messages:
        messages.append({"role": msg.role, "content": msg.content})

    try:
        response = completion(
            model=MODEL,
            messages=messages,
            response_format=LLMResponse,
            reasoning_effort="low",
            extra_body=EXTRA_BODY,
            api_key=settings.openrouter_api_key,
            api_base="https://openrouter.ai/api/v1",
        )
        raw = response.choices[0].message.content
        # Strip markdown code fences in case the model wraps its output
        if raw.strip().startswith("```"):
            raw = re.sub(r"^```(?:json)?\s*", "", raw.strip(), flags=re.MULTILINE)
            raw = re.sub(r"```\s*$", "", raw.strip())
        parsed = LLMResponse.model_validate_json(raw.strip())
    except Exception as exc:
        logger.exception("LLM call failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI service error — please try again",
        )

    updated_fields = _dict_to_fields(parsed.fields)
    return ChatResponse(
        reply=parsed.reply,
        fields=updated_fields,
        is_complete=parsed.is_complete,
    )
