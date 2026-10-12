# CampusXChange

A full-stack campus marketplace where students can list, buy, trade, and chat about items in real time.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js (JavaScript), Tailwind CSS, Vite |
| Backend | Python 3.11+, Flask, Flask-SocketIO |
| Database | MySQL 8.0+ |
| Real-time | WebSockets via Socket.IO |
| Image processing | Pillow (server-side resize + compress) |
| Auth | JWT (PyJWT + bcrypt) |

---

## Prerequisites

- **Node.js 18+** — https://nodejs.org
- **Python 3.11+** — https://www.python.org
- **MySQL 8.0+** — https://dev.mysql.com/downloads/mysql/

---

## Quick Start

### 1 — Database setup

```sql
-- In MySQL shell or Workbench:
source database/schema.sql
```

Or using the CLI:
```bash
mysql -u root -p < database/schema.sql
```

### 2 — Backend setup

```bash
cd backend

# Create a virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env       # then edit .env with your DB credentials
```

Edit `backend/.env`:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=campusxchange
JWT_SECRET=change_this_to_a_long_random_string
FRONTEND_URL=http://localhost:5173
```

Start the backend:
```bash
python app.py
# Running on http://localhost:5000
```

### 3 — Frontend setup

```bash
# From the project root
npm install
npm run dev
# Running on http://localhost:5173
```

---

## Features

| Feature | Description |
|---------|-------------|
| **Auth** | Sign up / sign in with email + password (JWT, bcrypt) |
| **Browse** | Search listings by keyword, category, price range; sort by date/price |
| **Listings** | Create listings with title, description, category, condition, price, exchange type |
| **Image upload** | Upload product photos → Pillow resizes to 1024 px JPEG automatically |
| **Offers** | Make purchase or trade offers; seller can accept/reject |
| **Real-time chat** | Socket.IO WebSocket chat between buyer and seller per listing |
| **Messages** | View all active conversations |
| **My Listings** | Manage own listings (mark sold, delete) and view received offers |
| **Profile** | Edit name, university, phone |

---

## Project Structure

```
project/
├── backend/
│   ├── app.py               # Flask app factory + SocketIO init
│   ├── database.py          # SQLAlchemy models (User, Profile, Product, Offer, Conversation, Message)
│   ├── auth_utils.py        # JWT create/decode, @require_auth decorator
│   ├── image_utils.py       # Pillow image processing + file storage
│   ├── socket_events.py     # Socket.IO event handlers (join/leave/send)
│   ├── requirements.txt
│   ├── .env                 # Backend secrets (not committed)
│   └── routes/
│       ├── auth.py          # POST /api/auth/signup, signin, GET /api/auth/me
│       ├── products.py      # CRUD /api/products/
│       ├── offers.py        # CRUD /api/offers/
│       ├── conversations.py # /api/conversations/
│       ├── messages.py      # /api/messages/conversation/<id>
│       ├── profile.py       # /api/profile/
│       └── images.py        # POST /api/images/upload  (Pillow processing)
│
├── src/
│   ├── App.jsx              # Root component + page routing
│   ├── main.jsx             # React entry point
│   ├── context/
│   │   └── AuthContext.jsx  # Auth state, signIn/signUp/signOut
│   ├── lib/
│   │   ├── api.js           # Axios client (attaches JWT, handles 401)
│   │   └── socket.js        # Socket.IO singleton (connect/disconnect)
│   ├── components/
│   │   ├── Navbar.jsx
│   │   └── ProductCard.jsx
│   └── pages/
│       ├── AuthPage.jsx
│       ├── HomePage.jsx
│       ├── NewListingPage.jsx
│       ├── ProductDetailPage.jsx
│       ├── ChatPage.jsx
│       ├── MessagesPage.jsx
│       ├── MyListingsPage.jsx
│       └── ProfilePage.jsx
│
├── database/
│   └── schema.sql           # Raw MySQL DDL (use if not relying on SQLAlchemy auto-create)
│
├── index.html
├── package.json
├── vite.config.js           # Dev proxy → Flask :5000
└── tailwind.config.js
```

---

## API Reference

### Auth
| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/api/auth/signup` | `{email, password, full_name, campus_id, university, phone?}` | Register |
| POST | `/api/auth/signin` | `{email, password}` | Login → JWT token |
| GET  | `/api/auth/me` | — | Current user + profile |

### Products
| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/products/` | All products with seller profile |
| GET    | `/api/products/<id>` | Single product |
| POST   | `/api/products/` | Create listing |
| PATCH  | `/api/products/<id>` | Update listing (owner only) |
| DELETE | `/api/products/<id>` | Delete listing (owner only) |

### Offers
| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/offers/product/<product_id>` | Offers on a product |
| POST   | `/api/offers/` | Make an offer |
| PATCH  | `/api/offers/<id>` | Accept / reject / withdraw |

### Conversations & Messages
| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/conversations/` | My conversations |
| GET    | `/api/conversations/<id>` | Single conversation |
| POST   | `/api/conversations/` | Start conversation `{product_id}` |
| GET    | `/api/messages/conversation/<id>` | Message history |
| POST   | `/api/messages/conversation/<id>` | Send message (REST fallback) |

### Profile & Images
| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/profile/` | My profile |
| PATCH  | `/api/profile/` | Update profile |
| POST   | `/api/images/upload` | Upload image (multipart, field: `image`) → URL |

### WebSocket Events
| Event (client → server) | Payload | Description |
|--------------------------|---------|-------------|
| `join_conversation` | `{conversation_id}` | Subscribe to room |
| `leave_conversation` | `{conversation_id}` | Unsubscribe |
| `send_message` | `{conversation_id, content}` | Send + persist message |

| Event (server → client) | Payload | Description |
|--------------------------|---------|-------------|
| `joined` | `{conversation_id}` | Confirmed room join |
| `new_message` | Message object | New message in room |

Connect with: `io('/', { query: { token: '<jwt>' } })`
