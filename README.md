# 🌍 WanderLust — Vacation Rental Platform

Live Site: https://wanderlust-1k0r.onrender.com/listings

WanderLust is a full-stack web application inspired by Airbnb that allows users to browse, book, and manage vacation rental listings — from cozy cabins to luxury villas. The platform supports user authentication, property creation, secure bookings, reviews, and an admin approval workflow for listings.

---

## 📌 Features

### 🧑‍💻 User Functionality
- 🔎 **Search & Filter Listings**  
  Users can search listings by country or city using the search bar on the homepage. :contentReference[oaicite:0]{index=0}
- 🏡 **Browse Approved Listings**  
  Only listings approved by an admin are displayed on the public site. :contentReference[oaicite:1]{index=1}
- 🛏️ **View Listing Details**  
  Clicking on a listing shows detailed information including location, price, description, amenities, host info, and reviews.
- 📅 **Make Bookings**  
  Logged-in users can select dates and submit a booking request (after admin approval of the listing).
- ⭐ **Leave Reviews**  
  After a completed stay, users can leave ratings and comments for listings.
- 👤 **User Profile & Dashboard**  
  Registered users can view their bookings, manage their own listings, and update account details.

### 🧑‍💼 Host/Owner Functionality
- ➕ **Create Property Listings**  
  Logged-in users can list their properties with images, price, location, and amenities.
- ✏️ **Edit / Delete Listings**  
  Owners can update or remove their own listings.
- 📸 **Image Uploads (Cloudinary)**  
  Property photos are uploaded and served via Cloudinary for efficient image handling.

### 🛡️ Admin Functionality
- ✅ **Pending Approvals Dashboard**  
  Admins review newly created listings before they go live.
- 📍 **Approve or Reject Listings**  
  Admins can approve a pending listing or delete it if it doesn’t meet platform standards.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|-------|--------------|
| Frontend | HTML, CSS, JavaScript, Bootstrap, EJS templates |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas with Mongoose |
| Authentication | Passport.js (with sessions) |
| Storage | Cloudinary for images |
| Validation | Joi for request validation |
| Deployment | Render (hosting), environment config via dotenv |
| Extras | flash messages, session storage, file uploads with multer |

---

## 🚀 Live Site Navigation

### 🔍 Explore Listings  
Navigate to the Listings page to view a grid of properties:

![Listing Page Example](https://wanderlust-1k0r.onrender.com/listings) :contentReference[oaicite:2]{index=2}

### 🧑‍💼 Admin Panel (requires admin login)  
Admins see a separate menu with links to pending approvals.

### 📅 Booking & Reviews  
Users see booking forms and reviews only where relevant and authorized.

---

## 📌 User Roles & Access

| Role | Permissions |
|------|-------------|
| Guest | View approved listings, search |
| Registered User | Book listings, leave reviews, list properties |
| Owner | Edit/Delete own listings |
| Admin | Approve/Reject listings, moderate content |

---

## 📁 Project Structure (Typical/MVC)

- /controllers # Route logic for users, admin, listings
- /middleware # Auth and validation middleware
- /models # Mongoose schemas (User, Listing, Booking, Review)
- /routes # Express routers (listings, users, admin, reviews)
- /views # EJS templates for UI
- /utils # Helpers like ExpressError, wrapAsync

## ✔ Usage Instructions (Local Setup)

1. Clone the repo  
2. Install dependencies  
   ```bash
   npm install
3. Create .env with keys for:

- MONGODB_URI
- CLOUDINARY_URL / CLOUDINARY_CLOUD_NAME / CLOUDINARY_KEY / CLOUDINARY_SECRET
- SESSION_SECRET

4. Run locally
  npm start
