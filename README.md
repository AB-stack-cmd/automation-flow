# Workspace Project (Next.js + Express)

## Overview
A premium starter that combines a **Next.js** front‑end with an **Express** back‑end.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the Next.js development server (http://localhost:3000) |
| `npm run server` | Starts the Express server (http://localhost:4000) |
| `npm run dev:full` | Runs **both** servers concurrently (ideal for local development) |
| `npm run build` | Builds the Next.js production bundle |
| `npm start` | Starts the Next.js production server (`next start`) |

## Development

```bash
# Install dependencies (already done)
npm install

# Run both front‑end and back‑end together
npm run dev:full
```

- Open **http://localhost:3000** to view the Next.js UI.  
- Open **http://localhost:4000/api/health** to verify the Express server.  

## Customisation
- Change the Express port by setting `PORT` in the environment or editing `server/index.js`.  
- Extend the API in `server/index.js` as needed.  

Enjoy your premium‑styled development environment! 🚀
