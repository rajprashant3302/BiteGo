# 🍔 BiteGo — Microservices-Based Food Ordering Platform

![React](https://img.shields.io/badge/Frontend-React.js-blue)
![Node](https://img.shields.io/badge/Backend-Node.js-green)
![GraphQL](https://img.shields.io/badge/API-GraphQL-pink)
![Socket.IO](https://img.shields.io/badge/Realtime-Socket.IO-black)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-darkgreen)
![Docker](https://img.shields.io/badge/Container-Docker-blue)

🚀 **BiteGo** is a scalable **microservices-based food ordering platform**, inspired by real-world systems like **Zomato** and **Swiggy**.

It supports **real-time order management**, **vendor workflows**, and **live communication** between users and vendors.

---

## 🎯 Project Overview

BiteGo simulates a real-world distributed food delivery platform where:

- 👤 Users can browse restaurants and place orders
- 🏪 Vendors receive and manage orders
- 💬 Users and vendors communicate through chat
- ⚡ Orders update in real time
- 📦 Services run independently using microservices

This project demonstrates **modern full-stack distributed system design**.

---

## 🏗️ System Architecture

The platform follows a **Microservices Architecture** with independent services communicating through a centralized **GraphQL API Gateway**.

### 🔧 Core Services

- 🔐 Authentication Service
- 👤 User Service
- 🏪 Vendor Service
- 📦 Order Service
- 💬 Chat Service

### 🧱 Infrastructure

- 🗄️ MongoDB — Database
- ⚡ Redis — Caching
- 📡 Kafka — Event Streaming
- 🐳 Docker — Containerization
- 🌐 NGINX — Reverse Proxy

---

## ⚡ Key Features

### 👤 User Side

- Login and signup authentication
- Browse restaurants
- Add items to cart
- Place food orders
- View order history
- Chat with vendors

### 🏪 Vendor Side

- Vendor dashboard
- Live incoming orders
- Update order status
- Menu management
- Real-time notifications

### 💬 Real-Time System

- Live order updates using **Socket.IO**
- Instant messaging system
- Dynamic UI updates without refresh

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js |
| Backend | Node.js |
| API | GraphQL |
| Realtime | Socket.IO |
| Database | MongoDB |
| Cache | Redis |
| Messaging | Kafka |
| Container | Docker |
| Routing | NGINX |
---

## 👨‍💻 My Contribution

I worked primarily as a **Frontend Developer**, focusing on building user-facing workflows and integrating frontend systems with backend microservices.

### 🚀 Key Contributions

- Developed **User Interface** and **Vendor Dashboard** using React.js  
- Built **40+ reusable React components** across **12+ UI pages**  
- Integrated **20+ GraphQL APIs** connecting frontend with backend microservices  
- Implemented **real-time order updates** using **Socket.IO**  
- Designed **Chat Service UI** enabling live communication between users and vendors  
- Coordinated with backend teams to ensure seamless API integration and workflow consistency  

---

## 🔄 Workflow Overview

### 📦 Order Flow

User places order  
↓  
GraphQL Gateway  
↓  
Order Service  
↓  
Event Trigger (Kafka)  
↓  
Vendor receives real-time order update  

---

### 💬 Chat Flow

User sends message  
↓  
Socket.IO Connection  
↓  
Vendor receives message instantly  
↓  
UI updates dynamically  

---

## 📊 Project Highlights

- 40+ React Components Developed  
- 12+ UI Pages Built  
- 20+ Backend APIs Integrated  
- 6+ Microservices Connected  
- Real-time Order System Implemented  

---

## 📚 Learning Outcomes

Through this project, I gained hands-on experience in:

- Microservices Architecture  
- Frontend–Backend Integration  
- Real-time Systems using Socket.IO  
- GraphQL API Communication  
- Distributed System Debugging  
- Team-based Development  

---

## ▶️ Running the Project

```bash
# Clone repository
git clone <repository-link>

# Navigate into project
cd BiteGo

# Start services
docker-compose up
