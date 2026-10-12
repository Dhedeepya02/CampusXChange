export interface Profile {
  id: string;
  full_name: string;
  campus_id: string;
  university: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

export type ProductCategory =
  | 'Books'
  | 'Electronics'
  | 'Furniture'
  | 'Clothing'
  | 'Sports'
  | 'Other';

export type ProductCondition = 'New' | 'Like New' | 'Good' | 'Fair';

export type ExchangeType = 'sell' | 'trade' | 'both';

export type ProductStatus = 'available' | 'reserved' | 'sold';

export interface Product {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: ProductCategory;
  condition: ProductCondition;
  price: number;
  exchange_type: ExchangeType;
  image_url: string | null;
  status: ProductStatus;
  created_at: string;
}

export interface ProductWithProfile extends Product {
  profiles: Pick<Profile, 'id' | 'full_name' | 'university'> | null;
}

export type OfferType = 'purchase' | 'trade';
export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export interface Offer {
  id: string;
  product_id: string;
  buyer_id: string;
  offer_type: OfferType;
  offer_price: number | null;
  offer_message: string | null;
  status: OfferStatus;
  created_at: string;
}

export interface OfferWithDetails extends Offer {
  products: Pick<Product, 'id' | 'title' | 'image_url'> | null;
  profiles: Pick<Profile, 'id' | 'full_name'> | null;
}

export interface Conversation {
  id: string;
  product_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
}

export interface ConversationWithDetails extends Conversation {
  products: Pick<Product, 'id' | 'title' | 'image_url' | 'price'> | null;
  buyer_profile: Pick<Profile, 'id' | 'full_name'> | null;
  seller_profile: Pick<Profile, 'id' | 'full_name'> | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export const CATEGORIES: ProductCategory[] = [
  'Books',
  'Electronics',
  'Furniture',
  'Clothing',
  'Sports',
  'Other',
];

export const CONDITIONS: ProductCondition[] = ['New', 'Like New', 'Good', 'Fair'];

export const EXCHANGE_TYPES: { value: ExchangeType; label: string }[] = [
  { value: 'sell', label: 'Sell' },
  { value: 'trade', label: 'Trade' },
  { value: 'both', label: 'Sell or Trade' },
];
