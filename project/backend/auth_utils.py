"""
JWT authentication utilities.
"""
import os
import jwt
from functools import wraps
from datetime import datetime, timedelta, timezone
from typing import Optional
from flask import request, jsonify
from database import db, User

JWT_SECRET    = os.getenv("JWT_SECRET", "dev-secret")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 72


def create_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def get_current_user() -> Optional[User]:
    """Extract and validate bearer token, return User or None."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header[7:]
    payload = decode_token(token)
    if not payload:
        return None
    return db.session.get(User, payload["sub"])


def require_auth(f):
    """Decorator: inject `current_user` into the route or return 401."""
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, current_user=user, **kwargs)
    return decorated
