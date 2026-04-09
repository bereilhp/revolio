# Revolio

A minimal, slick container manager to control, monitor and orchestrate your Docker containers effortlessly.

## What It Does

- Shows running containers
- Shows live CPU, memory, and network usage
- Updates the dashboard every 5 seconds
- Uses Docker socket fallback for Linux/macOS paths

## Requirements

- Node.js `>=20.9.0`
- npm
- Docker Desktop (or Docker Engine) running

## Install

```bash
npm install
```

## Run (Development)

```bash
npm run dev
```

Open:

- Dashboard: [http://localhost:6969](http://localhost:6969)

## Run (Production)

```bash
npm run build
npm run start
```

## API Endpoints

- `GET /api/containers`  
  Lists running containers.
- `GET /api/usage`  
  Returns running containers with CPU, memory, and network usage snapshot.

## Docker Socket Behavior

No `.env` is required by default.

Revolio tries:

1. `/var/run/docker.sock`
2. `~/.docker/run/docker.sock` (macOS fallback)

If you see an `ENOENT` socket error, make sure Docker is running.

## Useful Scripts

```bash
npm run lint
npm run format
```
