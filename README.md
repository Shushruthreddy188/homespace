# 🏡 HomeSpace – Full Stack Real Estate Platform

HomeSpace is a production-style full-stack real estate platform that enables users to discover, explore, and interact with property listings through a map-driven experience.

Built using Spring Boot + React, the system is designed with scalable backend architecture, optimized data handling, and a responsive UI for real-world usability.

---

## 🌐 Live Demo

🚀 Frontend: https://homespace-two.vercel.app  
⚙️ Backend API: https://homespace-backend.onrender.com  

> ⚠️ Note: Backend may take a few seconds to wake up (free tier hosting)

---

## 🚀 Features

### 🏘️ Property Listings

* Browse properties for **buy** and **rent**
* Dynamic filtering based on listing type
* Clean and structured property data

### 🗺️ Map-Based Integration

* Interactive maps using **Leaflet**
* Location-based property visualization
* Geospatial data (lat/lon) support

### ❤️ User Interaction

* Favorite/save listings
* Owner-linked data model
* Scalable relational mapping

### ⚡ Performance & Design

* Optimized API responses
* Clean separation of concerns (Controller → Service → Repository)
* Responsive UI with smooth interactions

---

## 🛠️ Tech Stack

### 🔹 Frontend

* React 18 + TypeScript
* Tailwind CSS
* Leaflet (Maps)
* Axios (API calls)

### 🔹 Backend

* Java 21
* Spring Boot
* Spring Data JPA (Hibernate)
* PostgreSQL / MySQL
* REST APIs

### 🔹 Tools & DevOps

* Git & GitHub
* Maven
* Docker
* Vercel (Frontend Deployment)
* Render / EC2 (Backend Deployment)

---

## 📂 Project Structure

```id="b2p9gk"
homespace/
├── frontend/        # React application
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/         # Spring Boot application
│   ├── src/main/java/
│   ├── src/main/resources/
│   └── pom.xml
│
├── .gitignore
└── README.md
```

---

## ⚙️ Getting Started

### 1️⃣ Clone the Repository

```id="a8y3kl"
git clone https://github.com/<your-username>/homespace.git
cd homespace
```

---

### 2️⃣ Run Backend (Spring Boot)

```id="d93kls"
cd backend
mvn clean install
mvn spring-boot:run
```

📍 Runs at:

```id="l2k9sa"
http://localhost:8080
```

---

### 3️⃣ Run Frontend (React)

```id="k28sld"
cd frontend
npm install
npm start
```

📍 Runs at:

```id="q8s9la"
http://localhost:3000
```

---

## 🔗 API Endpoints

| Method | Endpoint          | Description             |
| ------ | ----------------- | ----------------------- |
| GET    | /buyListings      | Fetch all buy listings  |
| GET    | /rentListings     | Fetch all rent listings |
| GET    | /buyListings/{id} | Get specific listing    |

---

## ⚠️ Known Challenges & Solutions

### 🔁 Infinite Recursion (JPA Relationships)

* Issue: Owner → Listings → Owner loop caused large JSON responses
* Solution:

  * Used `@JsonIgnore` / DTO pattern
  * Reduced payload size significantly

---

## 📸 Screenshots / Demo

### 🏡 Landing Page – Search Experience
<img width="2559" height="1389" alt="Landing Page" src="https://github.com/user-attachments/assets/922973be-4c93-4861-83a1-38cd5148670c" />

> Clean and intuitive landing page with a unified search bar for browsing properties by location, neighborhood, or agent. Designed for quick discovery with minimal friction.

---

### 🔐 Authentication – Sign In Flow
<img width="2559" height="1387" alt="Sign In" src="https://github.com/user-attachments/assets/eb637ad4-d0c8-47bd-bd56-9e4a11df9f9c" />

> Secure and user-friendly authentication interface supporting login and account creation, forming the foundation for personalized user experiences.

---

### 👤 User Menu – Personalized Actions
<img width="2559" height="1384" alt="User Menu" src="https://github.com/user-attachments/assets/3150d6f4-d497-4fb9-b677-6980d9a5b44b" />

> Dynamic user profile dropdown enabling quick access to favorites, personal listings, and session management.

---

### 🏢 Rent Listings – Map + List View
<img width="2556" height="1462" alt="Rent Listings" src="https://github.com/user-attachments/assets/cc96027c-f66b-48d1-9985-2894dc0263c6" />

> Dual-pane layout combining property listings with an interactive map. Users can visually explore available rentals while viewing detailed listing information.

---

### 🏠 Buy Listings – Interactive Exploration
<img width="2559" height="1468" alt="Buy Listings" src="https://github.com/user-attachments/assets/2eb4022d-9e40-457e-a32e-95c12dc41715" />

> Seamless browsing experience for properties available for purchase, featuring map markers, filters, and structured listing cards.
---

## 🌟 Key Engineering Highlights

* Designed a **scalable REST API architecture**
* Implemented **map-based search experience**
* Reduced API payload size by avoiding recursive entity loading
* Built modular and reusable frontend components
* Ensured clean separation between data, business logic, and UI

---

## 🚧 Future Improvements

* 🔐 Authentication (JWT / OAuth2)
* 💬 Real-time chat between users
* ☁️ AWS S3 image uploads
* 📊 Advanced filtering (price, beds, location)
* ⚡ Redis caching for faster responses

---

## 👨‍💻 Author

**Shushruth Kumar Reddy Mandadi**
* Software Engineer

---
