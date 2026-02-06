# Zomato Clone (Microservices + Kafka)

This is a Docker-based microservices project with:
- Multiple frontends (user, admin, vendor, driver)
- Backend services (auth, order, chat, earning)
- GraphQL Gateway
- Kafka + Zookeeper
- Redis + MongoDB
- NGINX reverse proxy

## Prerequisites
Make sure you have these installed:

- Docker Desktop (Windows / Mac / Linux)
- Git

## How to Run (One Command)

```bash
git clone https://github.com/<your-username>/zomato-clone.git
cd repoName
docker-compose up -d --build


### to stop the app
```bash
docker-compose down

