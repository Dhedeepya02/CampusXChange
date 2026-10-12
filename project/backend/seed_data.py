"""
Seed script to create sample users, profiles, products, and offers.
Run this with: python seed_data.py
"""
import sys
import random
import bcrypt
from app import create_app
from database import db, User, Profile, Product, Offer, Conversation

# Sample data
CATEGORIES = ["Books", "Electronics", "Furniture", "Clothing", "Sports", "Other"]
CONDITIONS = ["New", "Like New", "Good", "Fair"]
EXCHANGE_TYPES = ["sell", "trade", "both"]
OFFER_TYPES = ["purchase", "trade"]
OFFER_STATUSES = ["pending", "accepted", "rejected"]

PRODUCT_TITLES = [
    "Calculus Textbook 3rd Edition",
    "Wireless Bluetooth Headphones",
    "Standing Desk",
    "Nike Running Shoes Size 10",
    "Basketball Official Size",
    "Organic Chemistry Lab Manual",
    "Laptop Stand Aluminum",
    "Study Lamp LED",
    "Hiking Backpack 40L",
    "Yoga Mat Premium",
    "Mechanical Keyboard RGB",
    "Physics Lab Notebook",
    "Gaming Mouse Wireless",
    "Desk Chair Ergonomic",
    "Scientific Calculator",
]

PRODUCT_DESCRIPTIONS = [
    "Great condition, barely used. Perfect for students.",
    "Like new, only used for one semester.",
    "Good condition with minor wear.",
    "Excellent condition, no scratches or damage.",
    "Fair condition, fully functional.",
]

def hash_password(password):
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def create_sample_data():
    """Create sample users, profiles, products, and offers."""
    app = create_app()
    
    with app.app_context():
        # Clear existing data
        print("Clearing existing data...")
        Offer.query.delete()
        Conversation.query.delete()
        Product.query.delete()
        Profile.query.delete()
        User.query.delete()
        db.session.commit()
        
        # Create 5 users with profiles
        users = []
        credentials = []
        
        for i in range(1, 6):
            email = f"user{i}@campus.edu"
            password = f"password{i}"
            password_hash = hash_password(password)
            
            user = User(
                email=email,
                password_hash=password_hash
            )
            db.session.add(user)
            db.session.flush()  # Get the user ID
            
            profile = Profile(
                id=user.id,
                full_name=f"Student {i}",
                campus_id=f"Campus{i:04d}",
                university=f"University {i}",
                phone=f"555-010{i}",
            )
            db.session.add(profile)
            
            users.append(user)
            credentials.append({
                "email": email,
                "password": password,
                "name": f"Student {i}"
            })
        
        db.session.commit()
        print(f"Created {len(users)} users with profiles")
        
        # Create products for each user (3 per user)
        all_products = []
        for user in users:
            for j in range(3):
                product = Product(
                    user_id=user.id,
                    title=random.choice(PRODUCT_TITLES),
                    description=random.choice(PRODUCT_DESCRIPTIONS),
                    category=random.choice(CATEGORIES),
                    condition=random.choice(CONDITIONS),
                    price=random.uniform(10, 200),
                    exchange_type=random.choice(EXCHANGE_TYPES),
                    status="available"
                )
                db.session.add(product)
                all_products.append(product)
        
        db.session.commit()
        print(f"Created {len(all_products)} products")
        
        # Create offers (each user makes 3 offers on other users' products)
        all_offers = []
        for user in users:
            # Get products from other users
            other_products = [p for p in all_products if p.user_id != user.id]
            if not other_products:
                continue
            
            # Make 3 offers on random products
            for _ in range(3):
                if not other_products:
                    break
                product = random.choice(other_products)
                other_products.remove(product)  # Avoid duplicate offers on same product
                
                offer = Offer(
                    product_id=product.id,
                    buyer_id=user.id,
                    offer_type=random.choice(OFFER_TYPES),
                    offer_price=random.uniform(float(product.price) * 0.8, float(product.price) * 1.2) if random.choice([True, False]) else None,
                    offer_message=f"I'm interested in this item. Let me know if it's still available!",
                    status=random.choice(OFFER_STATUSES)
                )
                db.session.add(offer)
                all_offers.append(offer)
        
        db.session.commit()
        print(f"Created {len(all_offers)} offers")
        
        # Print credentials
        print("\n" + "="*60)
        print("LOGIN CREDENTIALS")
        print("="*60)
        for cred in credentials:
            print(f"\nName: {cred['name']}")
            print(f"Email: {cred['email']}")
            print(f"Password: {cred['password']}")
        print("\n" + "="*60)
        
        print("\nSample data created successfully!")
        print(f"Total: {len(users)} users, {len(all_products)} products, {len(all_offers)} offers")

if __name__ == "__main__":
    create_sample_data()
