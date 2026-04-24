# 🏡 HomeSpace – Full Stack Real Estate Platform

HomeSpace is a modern full-stack real estate application that enables users to explore, search, and visualize properties for buying and renting. It combines a high-performance Spring Boot backend with a responsive React frontend, designed with scalability and user experience in mind.

---

## 🚀 Features

### 🏘️ Listings

* Browse properties for **buy** and **rent**
* Dynamic filtering based on listing type
* Clean and structured property data

### 🗺️ Map Integration

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
* REST API integration

### 🔹 Backend

* Java 17/21
* Spring Boot
* Spring Data JPA / Hibernate
* H2 / MySQL
* REST APIs

### 🔹 Tools & DevOps

* Git & GitHub
* Maven
* VS Code

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

*Add screenshots or a GIF demo here (highly recommended)*

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
Full Stack Software Engineer

---
