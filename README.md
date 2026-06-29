# Fleet Management System

A full-stack fleet/ride management SaaS with three role-based portals.

## Project Structure

```
Fleet_management/
├── backend/          # NestJS API (TypeScript + Prisma + MySQL)
├── admin-portal/     # React Admin Dashboard (TypeScript + Ant Design)
├── driver-portal/    # React Driver App (TypeScript + Ant Design)
└── customer-portal/  # React Customer App (TypeScript + Ant Design)
```

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Backend   | NestJS, TypeScript, Prisma, MySQL   |
| Frontend  | React, TypeScript, Ant Design       |
| Auth      | JWT + Refresh Tokens                |
| Realtime  | Socket.IO                           |
| Cache     | Redis                               |

## Portals

### Admin Portal (port 3001)
- View all rides, drivers, customers, vehicles
- Approve/reject ride requests
- Assign drivers and vehicles
- Dashboard analytics & reports
- Fuel and mileage tracking

### Driver Portal (port 3002)
- View assigned rides
- Accept, start, complete rides
- Upload mileage photos and fuel receipts
- Mark vehicle as stuck (emergency)

### Customer Portal (port 3003)
- Request a ride
- View existing rides in requested area (ride sharing)
- Track ride status in real-time
- View ride history

## Getting Started

### Backend
```bash
cd backend
cp .env.example .env        # update DATABASE_URL
npm install
npx prisma migrate dev
npm run start:dev
```

### Frontend Portals
```bash
cd admin-portal && npm start     # http://localhost:3001
cd driver-portal && npm start    # http://localhost:3002
cd customer-portal && npm start  # http://localhost:3003
```

## Modules

```
backend/src/
├── auth/           # JWT auth, login, register, guards
├── users/          # User CRUD
├── customers/      # Customer profiles
├── drivers/        # Driver profiles
├── vehicles/       # Vehicle management
├── rides/          # Ride requests & assignments
├── fuel/           # Fuel logs
├── mileage/        # Mileage tracking
├── notifications/  # Real-time notifications (Socket.IO)
├── dashboard/      # Analytics & KPIs
├── reports/        # Reports
└── common/         # Shared utilities, guards, decorators
```
