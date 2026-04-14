"""Tests for signup and login endpoints."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app


@pytest.fixture()
def client():
    """TestClient backed by a fresh in-memory database for each test.

    StaticPool forces all connections to share one in-memory DB so that
    tables created by create_all() are visible to every session.
    """
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    from app.models import User  # noqa: F401 — registers model with Base
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


def _default_chat_fields():
    return {
        "purpose": "", "effectiveDate": "",
        "mndaTermType": "expires", "mndaTermYears": "1",
        "confidentialityTermType": "years", "confidentialityTermYears": "1",
        "governingLaw": "", "jurisdiction": "", "modifications": "",
        "party1": {"company": "", "name": "", "title": "", "noticeAddress": ""},
        "party2": {"company": "", "name": "", "title": "", "noticeAddress": ""},
    }


# ── Signup ────────────────────────────────────────────────────────────────────

class TestSignup:
    def test_signup_returns_token(self, client):
        res = client.post("/api/auth/signup", json={"email": "a@example.com", "password": "secret"})
        assert res.status_code == 201
        body = res.json()
        assert "access_token" in body
        assert body["token_type"] == "bearer"
        assert len(body["access_token"]) > 10

    def test_duplicate_email_rejected(self, client):
        payload = {"email": "dup@example.com", "password": "secret"}
        client.post("/api/auth/signup", json=payload)
        res = client.post("/api/auth/signup", json=payload)
        assert res.status_code == 409
        assert "already registered" in res.json()["detail"].lower()

    def test_invalid_email_rejected(self, client):
        res = client.post("/api/auth/signup", json={"email": "not-an-email", "password": "secret"})
        assert res.status_code == 422

    def test_missing_password_rejected(self, client):
        res = client.post("/api/auth/signup", json={"email": "a@example.com"})
        assert res.status_code == 422

    def test_empty_body_rejected(self, client):
        res = client.post("/api/auth/signup", json={})
        assert res.status_code == 422


# ── Login ─────────────────────────────────────────────────────────────────────

class TestLogin:
    def _signup(self, client, email="user@example.com", password="mypassword"):
        client.post("/api/auth/signup", json={"email": email, "password": password})

    def test_login_valid_credentials(self, client):
        self._signup(client)
        res = client.post("/api/auth/login", json={"email": "user@example.com", "password": "mypassword"})
        assert res.status_code == 200
        assert "access_token" in res.json()

    def test_login_wrong_password(self, client):
        self._signup(client)
        res = client.post("/api/auth/login", json={"email": "user@example.com", "password": "wrongpass"})
        assert res.status_code == 401
        assert "invalid credentials" in res.json()["detail"].lower()

    def test_login_unknown_email(self, client):
        res = client.post("/api/auth/login", json={"email": "ghost@example.com", "password": "pass"})
        assert res.status_code == 401

    def test_login_token_is_usable(self, client):
        """Token from login should work to access a protected endpoint."""
        self._signup(client)
        token = client.post(
            "/api/auth/login",
            json={"email": "user@example.com", "password": "mypassword"},
        ).json()["access_token"]
        res = client.post(
            "/api/chat/message",
            headers={"Authorization": f"Bearer {token}"},
            json={"messages": [], "current_fields": _default_chat_fields()},
        )
        # 503 = no API key in test env — but auth passed (not 401)
        assert res.status_code != 401

    def test_signup_token_is_usable(self, client):
        """Token from signup should also grant access to protected endpoints."""
        token = client.post(
            "/api/auth/signup",
            json={"email": "new@example.com", "password": "pass"},
        ).json()["access_token"]
        res = client.post(
            "/api/chat/message",
            headers={"Authorization": f"Bearer {token}"},
            json={"messages": [], "current_fields": _default_chat_fields()},
        )
        assert res.status_code != 401
