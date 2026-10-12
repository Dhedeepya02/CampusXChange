"""
Authentication routes: sign-up, sign-in, sign-out, me.
"""
import bcrypt
from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError
from database import db, User, Profile
from auth_utils import create_token, require_auth

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/signup")
def signup():
    data = request.get_json(silent=True) or {}

    email     = (data.get("email") or "").strip().lower()
    password  = (data.get("password") or "")
    full_name = (data.get("full_name") or "").strip()
    campus_id = (data.get("campus_id") or "").strip()
    university = (data.get("university") or "").strip()
    phone     = (data.get("phone") or "").strip() or None
    avatar_url = data.get("avatar_url") or None

    # Validation
    if not email or "@" not in email:
        return jsonify({"error": "A valid email is required."}), 400
    if not password or len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters."}), 400
    if not full_name:
        return jsonify({"error": "Full name is required."}), 400
    if not campus_id:
        return jsonify({"error": "Campus ID is required."}), 400
    if not university:
        return jsonify({"error": "University is required."}), 400

    pw_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    user = User(email=email, password_hash=pw_hash)
    db.session.add(user)

    try:
        db.session.flush()  # get user.id before committing
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "An account with this email already exists."}), 409

    profile = Profile(
        id=user.id,
        full_name=full_name,
        campus_id=campus_id,
        university=university,
        phone=phone,
        avatar_url=avatar_url,
    )
    db.session.add(profile)
    db.session.commit()

    token = create_token(user.id)
    return jsonify({
        "token": token,
        "user": user.to_dict(),
        "profile": profile.to_dict(),
    }), 201


@auth_bp.post("/signin")
def signin():
    data = request.get_json(silent=True) or {}

    email    = (data.get("email") or "").strip().lower()
    password = (data.get("password") or "")

    print(f"DEBUG: Signin attempt for email: {email}, password length: {len(password)}")

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        print(f"DEBUG: User not found for email: {email}")
        return jsonify({"error": "Invalid login credentials."}), 401

    print(f"DEBUG: User found: {user.email}")
    print(f"DEBUG: Password hash: {user.password_hash}")

    try:
        result = bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8'))
        print(f"DEBUG: Password check result: {result}")
    except Exception as e:
        print(f"DEBUG: Password check error: {e}")
        return jsonify({"error": "Invalid login credentials."}), 401

    if not result:
        return jsonify({"error": "Invalid login credentials."}), 401

    token = create_token(user.id)
    return jsonify({
        "token": token,
        "user": user.to_dict(),
        "profile": user.profile.to_dict() if user.profile else None,
    })


@auth_bp.get("/me")
@require_auth
def me(current_user):
    return jsonify({
        "user": current_user.to_dict(),
        "profile": current_user.profile.to_dict() if current_user.profile else None,
    })
