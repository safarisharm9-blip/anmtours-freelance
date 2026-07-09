# Travel Agency

A modern travel agency website built with Next.js 16, TypeScript, Tailwind CSS, shadcn/ui, next-intl, TanStack Query, and Prisma with MongoDB.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Internationalization**: next-intl (English, Arabic, Russian, Italian)
- **Data Fetching**: TanStack Query (useQuery, useMutation)
- **Database**: Prisma with MongoDB

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Set up your environment variables:

```bash
cp .env.example .env
```

Edit `.env` and add your MongoDB connection string:

```
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/travel_agency?retryWrites=true&w=majority"
```

For booking invoice emails, configure Resend:

```
RESEND_API_KEY="re_..."
INVOICE_FROM_EMAIL="A&M Tours <bookings@yourdomain.com>"
INVOICE_ADMIN_EMAIL="safarisharm9@gmail.com"
```

3. Generate the Prisma client (runs automatically on `npm install`):

```bash
npx prisma generate
```

4. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) - you'll be redirected to `/en` (or your default locale).

## Project Structure

```
src/
├── app/
│   ├── [locale]/          # Locale-based routes
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── destinations/
│   │   ├── about/
│   │   └── contact/
│   └── api/               # API routes
├── components/
│   ├── layout/            # Navbar, Hero
│   ├── providers/        # QueryProvider
│   └── ui/               # shadcn components
├── hooks/                # useDestinations, etc.
├── i18n/                 # next-intl config
└── lib/                  # prisma, utils
messages/                 # Translation files (en, ar, ru, it)
prisma/
└── schema.prisma        # Database schema
```

## Features

- **Multi-language support**: Switch between English, Arabic (RTL), Russian, and Italian
- **Responsive design**: Mobile-first with shadcn/ui components
- **TanStack Query**: Example hooks for `useQuery` and `useMutation` in `src/hooks/use-destinations.ts`
- **Prisma + MongoDB**: Database setup with example Destination model

## Adding New Translations

1. Add keys to `messages/en.json`, `messages/ar.json`, `messages/ru.json`, and `messages/it.json`
2. Use in components: `const t = useTranslations('Namespace'); t('key')`

## Database

The Prisma schema includes an example `Destination` model. To push your schema to MongoDB:

```bash
npx prisma db push
```

For migrations (if using a SQL database):

```bash
npx prisma migrate dev
```
