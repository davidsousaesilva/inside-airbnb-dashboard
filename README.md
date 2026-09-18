# Inside Airbnb Dashboard

Vue.js dashboard for exploring Inside Airbnb listing data, with a UI designed in Figma. The frontend consumes a mock REST API served by [json-server](https://github.com/typicode/json-server) from a `db.json` dataset.

> Academic project developed at the University of Minho.

## Features

- Landing page, dashboard, map view, popular cities, and listing comparison
- Listing detail cards
- Data served through a mock REST API (json-server)

## Tech stack

Vue.js, Pinia, Vite, json-server

## Run locally

Start the mock API:

```bash
cd backend
npm install
npx json-server db.json
```

Start the frontend (new terminal):

```bash
cd frontend
npm install
npm run dev
```

## Data

The dataset (`db.json`) is generated from Inside Airbnb data using a script provided for the course. The API layer (json-server) was also indicated by the course; only the frontend and data organisation were built by the team.

## Team

- David Sousa e Silva
- Gonçalo Fernandes Amaro
- Tomás Barroso Ramalhete
