from typing import Optional

from pydantic import BaseModel, EmailStr


class SignupRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    email: str

    model_config = {"from_attributes": True}


# Chat schemas

class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class PartyFields(BaseModel):
    company: str = ""
    name: str = ""
    title: str = ""
    noticeAddress: str = ""


class NDAFields(BaseModel):
    purpose: str = ""
    effectiveDate: str = ""
    mndaTermType: str = "expires"
    mndaTermYears: str = "1"
    confidentialityTermType: str = "years"
    confidentialityTermYears: str = "1"
    governingLaw: str = ""
    jurisdiction: str = ""
    modifications: str = ""
    party1: PartyFields = PartyFields()
    party2: PartyFields = PartyFields()


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    current_fields: NDAFields


class ChatResponse(BaseModel):
    reply: str
    fields: NDAFields
    is_complete: bool
