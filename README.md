# WorkPulse

WorkPulse is a modern enterprise-grade Employee Work Management and Productivity Platform built for planning, execution tracking, analytics, and team productivity insights.

## Platform Overview

- Employee work planning and execution tracking
- Meeting management and action items
- Daily worklogs and utilization analytics
- Role-based access control for employees, leads, managers, HR, and admins
- Project hierarchy with company, department, project, module, and task structures

## Architecture

- Frontend: React + TypeScript + Tailwind CSS + Framer Motion
- Backend: Spring Boot REST API
- Database: PostgreSQL
- Authentication: JWT + OAuth2-ready
- Real-time: WebSocket-ready architecture
- Deployment: Docker / Docker Compose

## Getting Started

### Backend

```bash
cd backend
./mvnw clean package
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Compose

```bash
docker-compose up --build
```
