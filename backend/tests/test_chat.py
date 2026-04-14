"""Tests for the AI chat endpoint and document registry."""

import json
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.auth import get_current_user
from app.documents import REGISTRY, DocumentSpec
from app.main import app
from app.models import User
from app.routers.chat import _build_system_prompt


def _make_user():
    user = MagicMock(spec=User)
    user.id = 1
    user.email = "test@example.com"
    return user


def _empty_fields(doc_type: str) -> dict:
    return REGISTRY[doc_type].initial_fields()


@pytest.fixture()
def client():
    return TestClient(app)


@pytest.fixture()
def auth_client():
    """Client with auth dependency overridden — no real token needed."""
    app.dependency_overrides[get_current_user] = _make_user
    yield TestClient(app)
    app.dependency_overrides.clear()


# ── Document registry tests ───────────────────────────────────────────────────

def test_registry_has_all_document_types():
    expected = {
        "mutual-nda", "csa", "design-partner", "sla", "psa",
        "dpa", "partnership", "software-license", "pilot", "baa", "ai-addendum",
    }
    assert set(REGISTRY.keys()) == expected


def test_all_specs_have_fields():
    for key, spec in REGISTRY.items():
        assert len(spec.fields) > 0, f"{key} has no fields"


def test_initial_fields_are_strings():
    for key, spec in REGISTRY.items():
        for field_key, value in spec.initial_fields().items():
            assert isinstance(value, str), f"{key}.{field_key} default is not a string"


def test_all_specs_have_party_fields():
    """Every document type should collect both party details."""
    for key, spec in REGISTRY.items():
        keys = {f.key for f in spec.fields}
        assert "party1_company" in keys, f"{key} missing party1_company"
        assert "party2_company" in keys, f"{key} missing party2_company"


def test_system_prompt_includes_all_field_keys():
    for key, spec in REGISTRY.items():
        fields = spec.initial_fields()
        prompt = _build_system_prompt(spec, fields)
        for f in spec.fields:
            assert f.key in prompt, f"System prompt for {key} missing field key '{f.key}'"


def test_system_prompt_mentions_document_name():
    spec = REGISTRY["mutual-nda"]
    prompt = _build_system_prompt(spec, spec.initial_fields())
    assert "Mutual Non-Disclosure Agreement" in prompt


# ── Catalog endpoint ──────────────────────────────────────────────────────────

def test_catalog_returns_all_document_types(client):
    res = client.get("/api/catalog")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == len(REGISTRY)
    keys = {entry["key"] for entry in data}
    assert "mutual-nda" in keys
    assert "csa" in keys
    assert "baa" in keys


def test_catalog_entries_have_required_fields(client):
    res = client.get("/api/catalog")
    for entry in res.json():
        assert "key" in entry
        assert "name" in entry
        assert "description" in entry
        assert entry["name"]  # non-empty


# ── Chat endpoint — auth and validation ──────────────────────────────────────

class TestChatAuth:
    def test_requires_auth(self, client):
        res = client.post(
            "/api/chat/message",
            json={"document_type": "mutual-nda", "messages": [], "current_fields": {}},
        )
        assert res.status_code in (401, 403)

    def test_invalid_token_rejected(self, client):
        res = client.post(
            "/api/chat/message",
            headers={"Authorization": "Bearer not-a-real-token"},
            json={"document_type": "mutual-nda", "messages": [], "current_fields": {}},
        )
        assert res.status_code == 401

    def test_missing_groq_key_returns_503(self, auth_client):
        with patch("app.routers.chat.settings") as mock_settings:
            mock_settings.groq_api_key = ""
            res = auth_client.post(
                "/api/chat/message",
                json={"document_type": "mutual-nda", "messages": [], "current_fields": {}},
            )
        assert res.status_code == 503

    def test_unknown_document_type_returns_400(self, auth_client):
        with patch("app.routers.chat.settings") as mock_settings:
            mock_settings.groq_api_key = "sk-test"
            res = auth_client.post(
                "/api/chat/message",
                json={"document_type": "employment-contract", "messages": [], "current_fields": {}},
            )
        assert res.status_code == 400
        assert "employment-contract" in res.json()["detail"]


# ── Chat endpoint — successful responses ──────────────────────────────────────

def _mock_llm(reply: str, fields: dict, is_complete: bool = False):
    """Return a mock LiteLLM completion object with the given payload."""
    payload = json.dumps({"reply": reply, "fields": fields, "is_complete": is_complete})
    mock_choice = MagicMock()
    mock_choice.message.content = payload
    mock_response = MagicMock()
    mock_response.choices = [mock_choice]
    return mock_response


def _post_chat(auth_client, doc_type: str, llm_response, messages=None, fields=None):
    with (
        patch("app.routers.chat.settings") as mock_settings,
        patch("app.routers.chat.completion", return_value=llm_response),
    ):
        mock_settings.groq_api_key = "sk-test"
        return auth_client.post(
            "/api/chat/message",
            json={
                "document_type": doc_type,
                "messages": messages or [],
                "current_fields": fields or {},
            },
        )


class TestChatResponses:
    def test_successful_nda_response(self, auth_client):
        fields = _empty_fields("mutual-nda")
        mock_resp = _mock_llm("Hello! What is the purpose of this NDA?", fields)
        res = _post_chat(auth_client, "mutual-nda", mock_resp)

        assert res.status_code == 200
        body = res.json()
        assert body["reply"] == "Hello! What is the purpose of this NDA?"
        assert body["is_complete"] is False
        assert "fields" in body

    def test_successful_csa_response(self, auth_client):
        fields = _empty_fields("csa")
        mock_resp = _mock_llm("Let's start with the subscription period.", fields)
        res = _post_chat(auth_client, "csa", mock_resp)

        assert res.status_code == 200
        assert res.json()["reply"] == "Let's start with the subscription period."

    def test_fields_merged_in_response(self, auth_client):
        initial = _empty_fields("mutual-nda")
        returned = {**initial, "purpose": "Evaluating a partnership", "governingLaw": "Delaware"}
        mock_resp = _mock_llm("Got it. Who are the parties?", returned)
        res = _post_chat(auth_client, "mutual-nda", mock_resp, fields=initial)

        assert res.status_code == 200
        body = res.json()
        assert body["fields"]["purpose"] == "Evaluating a partnership"
        assert body["fields"]["governingLaw"] == "Delaware"

    def test_is_complete_true_when_llm_says_so(self, auth_client):
        filled = {k: "filled value" for k in _empty_fields("pilot")}
        mock_resp = _mock_llm("Your pilot agreement is complete!", filled, is_complete=True)
        res = _post_chat(auth_client, "pilot", mock_resp)

        assert res.status_code == 200
        assert res.json()["is_complete"] is True

    def test_llm_exception_returns_502(self, auth_client):
        with (
            patch("app.routers.chat.settings") as mock_settings,
            patch("app.routers.chat.completion", side_effect=Exception("timeout")),
        ):
            mock_settings.groq_api_key = "sk-test"
            res = auth_client.post(
                "/api/chat/message",
                json={"document_type": "mutual-nda", "messages": [], "current_fields": {}},
            )
        assert res.status_code == 502

    def test_response_schema_shape(self, auth_client):
        fields = _empty_fields("mutual-nda")
        mock_resp = _mock_llm("Test", fields)
        res = _post_chat(auth_client, "mutual-nda", mock_resp)

        assert res.status_code == 200
        body = res.json()
        assert "reply" in body
        assert "fields" in body
        assert "is_complete" in body

    def test_fields_always_contain_spec_defaults(self, auth_client):
        """LLM omitting some fields should not drop them — spec defaults fill the gap."""
        partial_fields = {"purpose": "test"}  # LLM returns only one field
        mock_resp = _mock_llm("Got it.", partial_fields)
        res = _post_chat(auth_client, "mutual-nda", mock_resp)

        assert res.status_code == 200
        body_fields = res.json()["fields"]
        # All spec fields should be present
        for f in REGISTRY["mutual-nda"].fields:
            assert f.key in body_fields, f"Missing field '{f.key}' in response"

    def test_multi_turn_history_accepted(self, auth_client):
        fields = _empty_fields("dpa")
        mock_resp = _mock_llm("Got it.", fields)
        messages = [
            {"role": "user", "content": "Hi"},
            {"role": "assistant", "content": "Hello! Let's get started."},
            {"role": "user", "content": "The data subjects are our end users."},
        ]
        res = _post_chat(auth_client, "dpa", mock_resp, messages=messages)
        assert res.status_code == 200


# ── Edge-case tests ───────────────────────────────────────────────────────────

class TestChatEdgeCases:
    def test_markdown_fences_stripped(self, auth_client):
        fields = _empty_fields("mutual-nda")
        payload = f'```json\n{json.dumps({"reply": "Hi!", "fields": fields, "is_complete": False})}\n```'
        mock_choice = MagicMock()
        mock_choice.message.content = payload
        mock_response = MagicMock()
        mock_response.choices = [mock_choice]

        with (
            patch("app.routers.chat.settings") as mock_settings,
            patch("app.routers.chat.completion", return_value=mock_response),
        ):
            mock_settings.groq_api_key = "sk-test"
            res = auth_client.post(
                "/api/chat/message",
                json={"document_type": "mutual-nda", "messages": [], "current_fields": {}},
            )
        assert res.status_code == 200
        assert res.json()["reply"] == "Hi!"

    def test_malformed_json_returns_502(self, auth_client):
        mock_choice = MagicMock()
        mock_choice.message.content = "not valid json"
        mock_response = MagicMock()
        mock_response.choices = [mock_choice]

        with (
            patch("app.routers.chat.settings") as mock_settings,
            patch("app.routers.chat.completion", return_value=mock_response),
        ):
            mock_settings.groq_api_key = "sk-test"
            res = auth_client.post(
                "/api/chat/message",
                json={"document_type": "mutual-nda", "messages": [], "current_fields": {}},
            )
        assert res.status_code == 502

    def test_all_document_types_accepted(self, auth_client):
        """Every document type in the registry must be accepted by the endpoint."""
        for doc_type, spec in REGISTRY.items():
            fields = spec.initial_fields()
            mock_resp = _mock_llm("Hello!", fields)
            res = _post_chat(auth_client, doc_type, mock_resp)
            assert res.status_code == 200, f"Document type '{doc_type}' returned {res.status_code}"
