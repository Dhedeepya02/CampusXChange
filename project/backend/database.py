"""
SQLAlchemy database instance and all ORM models for CampusXChange.
"""
import uuid
from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def gen_uuid():
    return str(uuid.uuid4())


# ──────────────────────────────────────────────────────────────────────────────
# Models
# ──────────────────────────────────────────────────────────────────────────────

class User(db.Model):
    __tablename__ = "users"

    id           = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    email        = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at   = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    profile      = db.relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    products     = db.relationship("Product", back_populates="owner", cascade="all, delete-orphan")
    offers_made  = db.relationship("Offer", foreign_keys="Offer.buyer_id", back_populates="buyer", cascade="all, delete-orphan")
    conversations_as_buyer = db.relationship("Conversation", foreign_keys="Conversation.buyer_id", back_populates="buyer", cascade="all, delete-orphan")
    conversations_as_seller = db.relationship("Conversation", foreign_keys="Conversation.seller_id", back_populates="seller")

    def to_dict(self):
        return {"id": self.id, "email": self.email, "created_at": self.created_at.isoformat()}


class Profile(db.Model):
    __tablename__ = "profiles"

    id         = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    full_name  = db.Column(db.String(255), nullable=False)
    campus_id  = db.Column(db.String(100), nullable=False)
    university = db.Column(db.String(255), nullable=False)
    phone      = db.Column(db.String(50), nullable=True)
    avatar_url = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    user = db.relationship("User", back_populates="profile")

    def to_dict(self):
        return {
            "id": self.id,
            "full_name": self.full_name,
            "campus_id": self.campus_id,
            "university": self.university,
            "phone": self.phone,
            "avatar_url": self.avatar_url,
            "created_at": self.created_at.isoformat(),
        }


class Product(db.Model):
    __tablename__ = "products"

    id            = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    user_id       = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title         = db.Column(db.String(255), nullable=False)
    description   = db.Column(db.Text, nullable=False)
    category      = db.Column(db.String(50), nullable=False, default="Other")
    condition     = db.Column(db.String(50), nullable=False, default="Good")
    price         = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    exchange_type = db.Column(db.String(20), nullable=False, default="both")
    image_url     = db.Column(db.Text, nullable=True)
    status        = db.Column(db.String(20), nullable=False, default="available")
    created_at    = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    owner         = db.relationship("User", back_populates="products")
    offers        = db.relationship("Offer", back_populates="product", cascade="all, delete-orphan")
    conversations = db.relationship("Conversation", back_populates="product", cascade="all, delete-orphan")

    def to_dict(self, include_profile=False):
        d = {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "description": self.description,
            "category": self.category,
            "condition": self.condition,
            "price": float(self.price),
            "exchange_type": self.exchange_type,
            "image_url": self.image_url,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
        }
        if include_profile and self.owner and self.owner.profile:
            p = self.owner.profile
            d["profiles"] = {
                "id": p.id,
                "full_name": p.full_name,
                "university": p.university,
            }
        return d


class Offer(db.Model):
    __tablename__ = "offers"

    id            = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    product_id    = db.Column(db.String(36), db.ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    buyer_id      = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    offer_type    = db.Column(db.String(20), nullable=False, default="purchase")
    offer_price   = db.Column(db.Numeric(10, 2), nullable=True)
    offer_message = db.Column(db.Text, nullable=True)
    status        = db.Column(db.String(20), nullable=False, default="pending")
    created_at    = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    product = db.relationship("Product", back_populates="offers")
    buyer   = db.relationship("User", foreign_keys=[buyer_id], back_populates="offers_made")

    def to_dict(self, include_details=False):
        d = {
            "id": self.id,
            "product_id": self.product_id,
            "buyer_id": self.buyer_id,
            "offer_type": self.offer_type,
            "offer_price": float(self.offer_price) if self.offer_price is not None else None,
            "offer_message": self.offer_message,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
        }
        if include_details:
            if self.product:
                d["products"] = {
                    "id": self.product.id,
                    "title": self.product.title,
                    "image_url": self.product.image_url,
                }
            if self.buyer and self.buyer.profile:
                d["profiles"] = {
                    "id": self.buyer.id,
                    "full_name": self.buyer.profile.full_name,
                }
        return d


class Conversation(db.Model):
    __tablename__ = "conversations"
    __table_args__ = (db.UniqueConstraint("product_id", "buyer_id", name="uq_product_buyer"),)

    id         = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    product_id = db.Column(db.String(36), db.ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    buyer_id   = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    seller_id  = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    product  = db.relationship("Product", back_populates="conversations")
    buyer    = db.relationship("User", foreign_keys=[buyer_id], back_populates="conversations_as_buyer")
    seller   = db.relationship("User", foreign_keys=[seller_id], back_populates="conversations_as_seller")
    messages = db.relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

    def to_dict(self, include_details=False):
        d = {
            "id": self.id,
            "product_id": self.product_id,
            "buyer_id": self.buyer_id,
            "seller_id": self.seller_id,
            "created_at": self.created_at.isoformat(),
        }
        if include_details:
            if self.product:
                d["products"] = {
                    "id": self.product.id,
                    "title": self.product.title,
                    "image_url": self.product.image_url,
                    "price": float(self.product.price),
                }
            if self.buyer and self.buyer.profile:
                d["buyer_profile"] = {
                    "id": self.buyer.id,
                    "full_name": self.buyer.profile.full_name,
                }
            if self.seller and self.seller.profile:
                d["seller_profile"] = {
                    "id": self.seller.id,
                    "full_name": self.seller.profile.full_name,
                }
        return d


class Message(db.Model):
    __tablename__ = "messages"

    id              = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    conversation_id = db.Column(db.String(36), db.ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    sender_id       = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content         = db.Column(db.Text, nullable=False)
    created_at      = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    conversation = db.relationship("Conversation", back_populates="messages")
    sender       = db.relationship("User", foreign_keys=[sender_id])

    def to_dict(self):
        return {
            "id": self.id,
            "conversation_id": self.conversation_id,
            "sender_id": self.sender_id,
            "content": self.content,
            "created_at": self.created_at.isoformat(),
        }
