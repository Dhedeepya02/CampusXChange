/*
# CampusXChange - Complete Database Schema

Creates the full schema for an online campus resource exchange platform.
Students can list items (books, electronics, furniture, etc.), make offers,
and chat in real-time with other students about listings.

## Tables

### profiles
Extends Supabase auth.users with campus-specific data.
- id (uuid, PK, FK to auth.users)
- full_name (text) - student's display name
- campus_id (text) - campus ID number
- university (text) - university name
- phone (text) - optional contact phone
- avatar_url (text) - optional profile photo URL
- created_at (timestamptz)

### products
Listings posted by students for exchange or sale.
- id (uuid, PK)
- user_id (uuid, FK to auth.users, owner)
- title (text) - listing title
- description (text) - detailed description
- category (text) - Books, Electronics, Furniture, Clothing, Sports, Other
- condition (text) - New, Like New, Good, Fair
- price (numeric) - asking price (0 for free/trade)
- exchange_type (text) - sell, trade, or both
- image_url (text) - processed product image URL (stored in Supabase Storage)
- status (text) - available, reserved, sold
- created_at (timestamptz)

### offers
Requests/offers made by students on products.
- id (uuid, PK)
- product_id (uuid, FK to products)
- buyer_id (uuid, FK to auth.users, offer maker)
- offer_type (text) - purchase or trade
- offer_price (numeric) - offered price (null for trades)
- offer_message (text) - message accompanying the offer
- status (text) - pending, accepted, rejected, withdrawn
- created_at (timestamptz)

### conversations
Chat threads between two users about a specific product.
- id (uuid, PK)
- product_id (uuid, FK to products)
- buyer_id (uuid, FK to auth.users)
- seller_id (uuid, FK to auth.users)
- created_at (timestamptz)

### messages
Individual messages within a conversation.
- id (uuid, PK)
- conversation_id (uuid, FK to conversations)
- sender_id (uuid, FK to auth.users)
- content (text) - message text
- created_at (timestamptz)

## Security (RLS)
- profiles: users can read all profiles, update only their own
- products: all authenticated users can read; only owner can insert/update/delete
- offers: buyers can read their own and sellers can read offers on their products; only buyer can insert/update their offers
- conversations: participants (buyer + seller) can read and create
- messages: conversation participants can read; any participant can send
- Realtime is enabled on conversations and messages for live chat

## Notes
1. Owner columns default to auth.uid() so client inserts work without passing user_id
2. All foreign keys have ON DELETE CASCADE to clean up related data
3. Indexes on frequently-queried columns (category, status, product_id, conversation_id)
*/

-- ============ PROFILES ============
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  campus_id text NOT NULL,
  university text NOT NULL,
  phone text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_read_all" ON profiles;
CREATE POLICY "profiles_read_all" ON profiles FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============ PRODUCTS ============
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'Other',
  condition text NOT NULL DEFAULT 'Good',
  price numeric(10,2) NOT NULL DEFAULT 0,
  exchange_type text NOT NULL DEFAULT 'both',
  image_url text,
  status text NOT NULL DEFAULT 'available',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_read_all" ON products;
CREATE POLICY "products_read_all" ON products FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "products_insert_own" ON products;
CREATE POLICY "products_insert_own" ON products FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "products_update_own" ON products;
CREATE POLICY "products_update_own" ON products FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "products_delete_own" ON products;
CREATE POLICY "products_delete_own" ON products FOR DELETE
TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

-- ============ OFFERS ============
CREATE TABLE IF NOT EXISTS offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  offer_type text NOT NULL DEFAULT 'purchase',
  offer_price numeric(10,2),
  offer_message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

-- Buyers can read their own offers; sellers can read offers on their products
DROP POLICY IF EXISTS "offers_read_participants" ON offers;
CREATE POLICY "offers_read_participants" ON offers FOR SELECT
TO authenticated USING (
  auth.uid() = buyer_id
  OR EXISTS (
    SELECT 1 FROM products
    WHERE products.id = offers.product_id
    AND products.user_id = auth.uid()
  )
);

-- Only the buyer can create an offer (not on their own product)
DROP POLICY IF EXISTS "offers_insert_buyer" ON offers;
CREATE POLICY "offers_insert_buyer" ON offers FOR INSERT
TO authenticated WITH CHECK (
  auth.uid() = buyer_id
  AND NOT EXISTS (
    SELECT 1 FROM products
    WHERE products.id = offers.product_id
    AND products.user_id = auth.uid()
  )
);

-- Buyer can update their own offer; seller can update offer status (accept/reject)
DROP POLICY IF EXISTS "offers_update_participants" ON offers;
CREATE POLICY "offers_update_participants" ON offers FOR UPDATE
TO authenticated USING (
  auth.uid() = buyer_id
  OR EXISTS (
    SELECT 1 FROM products
    WHERE products.id = offers.product_id
    AND products.user_id = auth.uid()
  )
) WITH CHECK (
  auth.uid() = buyer_id
  OR EXISTS (
    SELECT 1 FROM products
    WHERE products.id = offers.product_id
    AND products.user_id = auth.uid()
  )
);

-- Only buyer can delete their own offer
DROP POLICY IF EXISTS "offers_delete_buyer" ON offers;
CREATE POLICY "offers_delete_buyer" ON offers FOR DELETE
TO authenticated USING (auth.uid() = buyer_id);

CREATE INDEX IF NOT EXISTS idx_offers_product_id ON offers(product_id);
CREATE INDEX IF NOT EXISTS idx_offers_buyer_id ON offers(buyer_id);

-- ============ CONVERSATIONS ============
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, buyer_id)
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Both participants can read the conversation
DROP POLICY IF EXISTS "conversations_read_participants" ON conversations;
CREATE POLICY "conversations_read_participants" ON conversations FOR SELECT
TO authenticated USING (
  auth.uid() = buyer_id OR auth.uid() = seller_id
);

-- Only buyer can create a conversation (about someone else's product)
DROP POLICY IF EXISTS "conversations_insert_buyer" ON conversations;
CREATE POLICY "conversations_insert_buyer" ON conversations FOR INSERT
TO authenticated WITH CHECK (
  auth.uid() = buyer_id
  AND EXISTS (
    SELECT 1 FROM products
    WHERE products.id = conversations.product_id
    AND products.user_id = conversations.seller_id
  )
);

-- Both participants can update (e.g. mark as read)
DROP POLICY IF EXISTS "conversations_update_participants" ON conversations;
CREATE POLICY "conversations_update_participants" ON conversations FOR UPDATE
TO authenticated USING (
  auth.uid() = buyer_id OR auth.uid() = seller_id
) WITH CHECK (
  auth.uid() = buyer_id OR auth.uid() = seller_id
);

CREATE INDEX IF NOT EXISTS idx_conversations_product_id ON conversations(product_id);
CREATE INDEX IF NOT EXISTS idx_conversations_buyer_id ON conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_seller_id ON conversations(seller_id);

-- ============ MESSAGES ============
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Participants of the conversation can read messages
DROP POLICY IF EXISTS "messages_read_participants" ON messages;
CREATE POLICY "messages_read_participants" ON messages FOR SELECT
TO authenticated USING (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
  )
);

-- Only conversation participants can send messages
DROP POLICY IF EXISTS "messages_insert_participants" ON messages;
CREATE POLICY "messages_insert_participants" ON messages FOR INSERT
TO authenticated WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
  )
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- ============ REALTIME ============
-- Enable realtime publication for conversations and messages
-- (Supabase uses WebSocket-based realtime under the hood)
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- ============ STORAGE BUCKET ============
-- Create a public bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to product-images bucket
DROP POLICY IF EXISTS "product_images_upload" ON storage.objects;
CREATE POLICY "product_images_upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Allow anyone to read product images (public bucket)
DROP POLICY IF EXISTS "product_images_read" ON storage.objects;
CREATE POLICY "product_images_read" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

-- Allow users to delete their own product images
DROP POLICY IF EXISTS "product_images_delete_own" ON storage.objects;
CREATE POLICY "product_images_delete_own" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'product-images' AND auth.uid() = owner);

-- Allow users to update their own product images
DROP POLICY IF EXISTS "product_images_update_own" ON storage.objects;
CREATE POLICY "product_images_update_own" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'product-images' AND auth.uid() = owner)
WITH CHECK (bucket_id = 'product-images' AND auth.uid() = owner);