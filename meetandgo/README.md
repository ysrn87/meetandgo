# MeetAndGo - Tourism Web Application

A modern, scalable tourism web application built for Indonesian local tourism companies. Features both Open Trip (per-person pricing) and Private Trip (per-group pricing) booking systems.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: PostgreSQL
- **ORM**: Prisma 6
- **Authentication**: NextAuth.js v5

## Features

### For Visitors
- ✅ View tour packages with filtering
- ✅ View package details (itineraries, highlights, pricing)
- ✅ Submit custom tour requests

### For Customers
- ✅ Register & login (email or phone)
- ✅ Book tours with participant management
- ✅ Save participant data for reuse
- ✅ View booking status
- ✅ Track custom request status
- ✅ Manage profile

### For Admins
- ✅ Manage tour packages (CRUD)
- ✅ Manage departure schedules
- ✅ Process bookings (status updates)
- ✅ Handle custom requests (pricing, tour guide assignment)
- ✅ Dashboard overview

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or pnpm

### Installation

1. **Clone and install dependencies**
```bash
cd meetandgo
npm install
```

2. **Configure environment**
```bash
cp .env.example .env
```

Edit `.env` with your database URL:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/meetandgo"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

3. **Setup database**
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (development)
npm run db:push

# Or run migrations (production)
npm run db:migrate

# Seed initial data
npm run db:seed
```

4. **Start development server**
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Default Login Credentials

After seeding:
- **Admin**: admin@meetandgo.id / Admin123!
- **Tour Guide**: guide@meetandgo.id / Guide123!
- **Customer**: customer@example.com / Customer123!

## Project Structure

```
meetandgo/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth pages (login, register)
│   │   ├── (main)/            # Public pages
│   │   ├── dashboard/         # Customer dashboard
│   │   ├── admin/             # Admin dashboard
│   │   └── api/               # API routes
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   ├── layout/            # Layout components
│   │   ├── forms/             # Form components
│   │   └── admin/             # Admin-specific components
│   ├── lib/
│   │   ├── auth/              # Authentication config
│   │   ├── db/                # Database client
│   │   ├── utils/             # Utility functions
│   │   └── validations/       # Zod schemas
│   ├── services/              # Business logic
│   ├── actions/               # Server actions
│   ├── types/                 # TypeScript types
│   └── hooks/                 # Custom hooks
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Seed data
└── public/
    └── uploads/               # File uploads
```

## Database Schema

### Core Entities
- **User**: Customers, admins, tour guides
- **TourPackage**: Tour packages with type (open/private)
- **Departure**: Scheduled departures with pricing
- **DepartureGroup**: Groups for private trips
- **Booking**: Customer bookings
- **Participant**: Participant details
- **CustomTourRequest**: Custom trip requests

### Trip Types
1. **Open Trip**: Price per person, multiple participants can join
2. **Private Trip**: Price per group, entire group booked at once

## Key Flows

### Booking Flow
1. Customer selects departure date
2. For open trip: select number of participants
3. For private trip: select available group
4. Add/select participants
5. Confirm booking
6. Pay within 24 hours (auto-expire otherwise)
7. Admin updates status: Pending → Payment Received → Processed → Ongoing → Completed

### Custom Request Flow
1. Customer submits request
2. Admin reviews and sets estimated price
3. Admin accepts with final price
4. Customer pays
5. Admin assigns tour guide
6. Status: Pending → In Review → Accepted → Paid → Processed → Ongoing → Completed

## API Routes

- `POST /api/auth/register` - User registration
- `GET/POST /api/admin/packages` - Package management
- `PATCH /api/admin/bookings/[id]/status` - Update booking status
- `PATCH /api/admin/custom-requests/[id]` - Update custom request

## Development Notes

### Adding New Features
1. Update Prisma schema if needed
2. Create service functions in `/src/services`
3. Create API routes or server actions
4. Build UI components
5. Add pages

### Code Style
- Use TypeScript strict mode
- Follow component-based architecture
- Use Zod for validation
- Implement proper error handling

## Deployment

1. Set production environment variables
2. Run database migrations
3. Build the application:
```bash
npm run build
```
4. Start production server:
```bash
npm run start
```

## License

MIT License - Feel free to use for your projects!
