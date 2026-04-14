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


class ChatRequest(BaseModel):
    document_type: str
    messages: list[ChatMessage]
    current_fields: dict[str, str]


class ChatResponse(BaseModel):
    reply: str
    fields: dict[str, str]
    is_complete: bool


# Catalog schema

class CatalogEntry(BaseModel):
    key: str
    name: str
    description: str
