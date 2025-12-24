# Docker Setup for Local Development

This guide explains how to run the PostgreSQL database using Docker Compose for local backend testing.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)

## Quick Start

### 1. Start the Database

```bash
docker-compose up -d
```

This will start:
- **PostgreSQL** on `localhost:5432`
- **Adminer** (database UI) on `http://localhost:8080`

### 2. Configure Environment Variables

Copy the Docker configuration to your `.env` file:

```bash
cp .env.docker .env
```

Then update `.env` with your actual values:
- `JWT_SECRET` - your JWT signing secret
- `CLOUDINARY_*` - your Cloudinary credentials

### 3. Create Database Schema

```bash
npm run create-schema
```

### 4. Seed Database (Optional)

```bash
npm run seed
npm run seedAdmin  # Create admin user
```

### 5. Start Backend Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000/api`

## Adminer Database UI

Access the Adminer web interface at **http://localhost:8080**

**Login credentials:**
- System: PostgreSQL
- Server: postgres
- Username: postgres
- Password: postgres
- Database: enish_radio

## Common Commands

### Stop the Database

```bash
docker-compose down
```

### Stop and Remove Data

```bash
docker-compose down -v
```

### View Database Logs

```bash
docker-compose logs postgres
```

### Access PostgreSQL CLI

```bash
docker exec -it enish-radio-postgres psql -U postgres -d enish_radio
```

## Environment Variables

Customize the Docker setup by setting environment variables:

```bash
DB_USER=myuser
DB_PASSWORD=mypassword
DB_NAME=my_database
DB_PORT=5432
docker-compose up -d
```

Or edit the `docker-compose.yml` file directly.

## Troubleshooting

### Port Already in Use

If port 5432 is already in use:
```bash
docker-compose down
# Edit docker-compose.yml and change the port mapping
docker-compose up -d
```

### Database Connection Failed

Check if PostgreSQL is running:
```bash
docker-compose ps
```

View logs:
```bash
docker-compose logs postgres
```

### Reset Database

Remove the volume and restart:
```bash
docker-compose down -v
docker-compose up -d
npm run create-schema
npm run seed
```
