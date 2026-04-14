import json
import logging
import re

from fastapi import APIRouter, Depends, HTTPException, status
from litellm import completion
from pydantic import BaseModel

from app.auth import get_current_user
from app.config import settings
from app.documents import REGISTRY, SUPPORTED_NAMES, DocumentSpec
from app.schemas import ChatRequest, ChatResponse

logger = logging.getLogger(__name__)

router = APIRouter()

MODEL = "groq/llama-3.3-70b-versatile"


class LLMResponse(BaseModel):
    reply: str
    fields: dict
    is_complete: bool


def _build_system_prompt(spec: DocumentSpec, current_fields: dict[str, str]) -> str:
    required = [f for f in spec.fields if not f.optional]
    optional = [f for f in spec.fields if f.optional]

    required_lines = "\n".join(
        f"- {f.key} ({f.label}): {f.description}" for f in required
    )
    optional_lines = (
        "\nOptional fields (collect if relevant, skip if not applicable):\n"
        + "\n".join(f"- {f.key} ({f.label}): {f.description}" for f in optional)
        if optional
        else ""
    )

    initial_fields_json = json.dumps(current_fields, indent=2)

    return f"""You are a friendly legal assistant helping users fill in a {spec.name}.

Your goal is to collect all required fields through natural, professional conversation. Ask about 1-2 related fields at a time, and briefly explain each field if it might be unclear.

Fields to collect:
{required_lines}{optional_lines}

RESPONSE FORMAT — always respond with valid JSON only, no markdown fences:
{{
  "reply": "Your conversational message to the user",
  "fields": {initial_fields_json},
  "is_complete": false
}}

Rules:
- In "fields", always carry forward ALL currently known values PLUS any new values extracted from the user's latest message.
- Set "is_complete" to true only when every required field has a non-empty value.
- When is_complete is true, congratulate the user and tell them they can download the document using the button above.
- Never ask for information already provided.
- If the user asks you to generate a document that is not a {spec.name}, politely explain that it is not currently supported and suggest the closest available option from: {SUPPORTED_NAMES}.
- Use a warm, professional tone."""


@router.post("/message", response_model=ChatResponse)
def chat_message(request: ChatRequest, _user=Depends(get_current_user)):
    if not settings.groq_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service not configured",
        )

    spec = REGISTRY.get(request.document_type)
    if not spec:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported document type '{request.document_type}'. Supported types: {list(REGISTRY.keys())}",
        )

    # Merge incoming fields with spec defaults so any missing keys are initialised
    current = {**spec.initial_fields(), **request.current_fields}

    system_prompt = _build_system_prompt(spec, current)

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "system", "content": f"Current document fields: {json.dumps(current)}"},
    ]
    for msg in request.messages:
        messages.append({"role": msg.role, "content": msg.content})

    try:
        response = completion(
            model=MODEL,
            messages=messages,
            response_format={"type": "json_object"},
            api_key=settings.groq_api_key,
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

    # Normalise: ensure all values are strings, carry forward defaults for missing keys
    returned_fields: dict[str, str] = {
        k: str(v) if v is not None else ""
        for k, v in parsed.fields.items()
    }
    # Fill in any keys the LLM omitted
    merged = {**spec.initial_fields(), **returned_fields}

    return ChatResponse(
        reply=parsed.reply,
        fields=merged,
        is_complete=parsed.is_complete,
    )
