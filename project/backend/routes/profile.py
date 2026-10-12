"""
Profile routes: view and update own profile.
"""
from flask import Blueprint, request, jsonify
from database import db, Profile
from auth_utils import require_auth

profile_bp = Blueprint("profile", __name__)


@profile_bp.get("/")
@require_auth
def get_profile(current_user):
    if not current_user.profile:
        return jsonify({"error": "Profile not found."}), 404
    return jsonify(current_user.profile.to_dict())


@profile_bp.get("/<user_id>")
@require_auth
def get_profile_by_id(user_id, current_user):
    profile = db.session.get(Profile, user_id)
    if not profile:
        return jsonify({"error": "Profile not found."}), 404
    return jsonify(profile.to_dict())


@profile_bp.patch("/")
@require_auth
def update_profile(current_user):
    if not current_user.profile:
        return jsonify({"error": "Profile not found."}), 404

    data = request.get_json(silent=True) or {}
    profile = current_user.profile

    if "full_name" in data:
        name = data["full_name"].strip()
        if len(name) < 2:
            return jsonify({"error": "Full name is too short."}), 400
        profile.full_name = name

    if "university" in data:
        uni = data["university"].strip()
        if not uni:
            return jsonify({"error": "University cannot be empty."}), 400
        profile.university = uni

    if "phone" in data:
        profile.phone = data["phone"].strip() or None

    if "avatar_url" in data:
        profile.avatar_url = data["avatar_url"] or None

    db.session.commit()
    return jsonify(profile.to_dict())
