"""Tests for the AI chat endpoint."""

from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.auth import get_current_user
from app.main import app
from app.models import User


def _make_user():
    user = MagicMock(spec=User)
    user.id = 1
    user.email = "test@example.com"
    return user


def _default_fields():
    return {
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
        "party2": {"company": "", "name": "", "title": "", "noticeAddress": ""},
    }


@pytest.fixture()
def client():
    return TestClient(app)


@pytest.fixture()
def auth_client():
    """Client with auth dependency overridden — no real token needed."""
    app.dependency_overrides[get_current_user] = _make_user
    yield TestClient(app)
    app.dependency_overrides.clear()


# ── Unit tests for helper functions ──────────────────────────────────────────

def test_fields_to_dict_roundtrip():
    from app.routers.chat import _dict_to_fields, _fields_to_dict
    from app.schemas import NDAFields, PartyFields

    original = NDAFields(
        purpose="Evaluating partnership",
        effectiveDate="2026-04-14",
        mndaTermType="expires",
        mndaTermYears="2",
        confidentialityTermType="perpetuity",
        confidentialityTermYears="1",
        governingLaw="Delaware",
        jurisdiction="New Castle, DE",
        modifications="None.",
        party1=PartyFields(company="Acme", name="Jane", title="CEO", noticeAddress="jane@acme.com"),
        party2=PartyFields(company="Beta", name="Bob", title="CTO", noticeAddress="bob@beta.com"),
    )

    as_dict = _fields_to_dict(original)
    restored = _dict_to_fields(as_dict)

    assert restored.purpose == original.purpose
    assert restored.governingLaw == original.governingLaw
    assert restored.party1.company == original.party1.company
    assert restored.party2.name == original.party2.name
    assert restored.confidentialityTermType == original.confidentialityTermType


def test_dict_to_fields_handles_missing_keys():
    from app.routers.chat import _dict_to_fields

    result = _dict_to_fields({})
    assert result.purpose == ""
    assert result.mndaTermType == "expires"
    assert result.party1.company == ""
    assert result.party2.noticeAddress == ""


# ── Integration tests for the chat endpoint ──────────────────────────────────

class TestChatMessageEndpoint:
    def test_requires_auth(self, client):
        res = client.post(
            "/api/chat/message",
            json={"messages": [], "current_fields": _default_fields()},
        )
        assert res.status_code in (401, 403)

    def test_invalid_token_rejected(self, client):
        res = client.post(
            "/api/chat/message",
            headers={"Authorization": "Bearer not-a-real-token"},
            json={"messages": [], "current_fields": _default_fields()},
        )
        assert res.status_code == 401

    def test_missing_openrouter_key_returns_503(self, auth_client):
        with patch("app.routers.chat.settings") as mock_settings:
            mock_settings.openrouter_api_key = ""
            res = auth_client.post(
                "/api/chat/message",
                json={"messages": [], "current_fields": _default_fields()},
            )
        assert res.status_code == 503

    def test_successful_response(self, auth_client):
        llm_payload = (
            '{"reply": "Hello! What is the purpose of this NDA?", '
            '"fields": {"purpose": "", "effectiveDate": "", "mndaTermType": "expires", '
            '"mndaTermYears": "1", "confidentialityTermType": "years", '
            '"confidentialityTermYears": "1", "governingLaw": "", "jurisdiction": "", '
            '"modifications": "", '
            '"party1": {"company": "", "name": "", "title": "", "noticeAddress": ""}, '
            '"party2": {"company": "", "name": "", "title": "", "noticeAddress": ""}}, '
            '"is_complete": false}'
        )

        mock_choice = MagicMock()
        mock_choice.message.content = llm_payload
        mock_response = MagicMock()
        mock_response.choices = [mock_choice]

        with (
            patch("app.routers.chat.settings") as mock_settings,
            patch("app.routers.chat.completion", return_value=mock_response),
        ):
            mock_settings.openrouter_api_key = "sk-test"
            res = auth_client.post(
                "/api/chat/message",
                json={"messages": [], "current_fields": _default_fields()},
            )

        assert res.status_code == 200
        body = res.json()
        assert body["reply"] == "Hello! What is the purpose of this NDA?"
        assert body["is_complete"] is False
        assert "fields" in body

    def test_llm_exception_returns_502(self, auth_client):
        with (
            patch("app.routers.chat.settings") as mock_settings,
            patch("app.routers.chat.completion", side_effect=Exception("timeout")),
        ):
            mock_settings.openrouter_api_key = "sk-test"
            res = auth_client.post(
                "/api/chat/message",
                json={"messages": [], "current_fields": _default_fields()},
            )
        assert res.status_code == 502

    def test_extracted_fields_in_response(self, auth_client):
        llm_payload = (
            '{"reply": "Got it. Who are the parties?", '
            '"fields": {"purpose": "Evaluating partnership", "effectiveDate": "2026-04-14", '
            '"mndaTermType": "expires", "mndaTermYears": "1", '
            '"confidentialityTermType": "years", "confidentialityTermYears": "1", '
            '"governingLaw": "", "jurisdiction": "", "modifications": "", '
            '"party1": {"company": "", "name": "", "title": "", "noticeAddress": ""}, '
            '"party2": {"company": "", "name": "", "title": "", "noticeAddress": ""}}, '
            '"is_complete": false}'
        )

        mock_choice = MagicMock()
        mock_choice.message.content = llm_payload
        mock_response = MagicMock()
        mock_response.choices = [mock_choice]

        with (
            patch("app.routers.chat.settings") as mock_settings,
            patch("app.routers.chat.completion", return_value=mock_response),
        ):
            mock_settings.openrouter_api_key = "sk-test"
            res = auth_client.post(
                "/api/chat/message",
                json={
                    "messages": [{"role": "user", "content": "evaluating a partnership"}],
                    "current_fields": _default_fields(),
                },
            )

        assert res.status_code == 200
        body = res.json()
        assert body["fields"]["purpose"] == "Evaluating partnership"

    def test_is_complete_true_when_all_fields_filled(self, auth_client):
        llm_payload = (
            '{"reply": "Your NDA is complete! Download it above.", '
            '"fields": {"purpose": "Evaluating partnership", "effectiveDate": "2026-04-14", '
            '"mndaTermType": "expires", "mndaTermYears": "2", '
            '"confidentialityTermType": "years", "confidentialityTermYears": "3", '
            '"governingLaw": "Delaware", "jurisdiction": "New Castle, DE", '
            '"modifications": "None.", '
            '"party1": {"company": "Acme", "name": "Jane", "title": "CEO", "noticeAddress": "jane@acme.com"}, '
            '"party2": {"company": "Beta", "name": "Bob", "title": "CTO", "noticeAddress": "bob@beta.com"}}, '
            '"is_complete": true}'
        )

        mock_choice = MagicMock()
        mock_choice.message.content = llm_payload
        mock_response = MagicMock()
        mock_response.choices = [mock_choice]

        with (
            patch("app.routers.chat.settings") as mock_settings,
            patch("app.routers.chat.completion", return_value=mock_response),
        ):
            mock_settings.openrouter_api_key = "sk-test"
            res = auth_client.post(
                "/api/chat/message",
                json={"messages": [], "current_fields": _default_fields()},
            )

        assert res.status_code == 200
        assert res.json()["is_complete"] is True
