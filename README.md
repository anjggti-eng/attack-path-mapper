<div align="center">

# Attack Path Mapper

### Open Source Attack Path Analysis & Visualization Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10+-3776AB.svg)](https://python.org)
[![React 18](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-009688.svg)](https://fastapi.tiangolo.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v3-06B6D4.svg)](https://tailwindcss.com)
[![shadcn/ui](https://img.shields.io/badge/shadcn-ui-Component_Library-white.svg)](https://ui.shadcn.com)

[**Dalton deploy →**](#-getting-started) · [**Report Bug**](https://github.com/anjggti-eng/attack-path-mapper/issues) · [**Request Feature**](https://github.com/anjggti-eng/attack-path-mapper/issues)

</div>

---

<br>

## Overview

Attack Path Mapper is a **self-hosted, open-source platform** that discovers organizational assets, maps their relationships, identifies attack vectors using graph theory, and visualizes everything in a real-time interactive dashboard.

Built for **red teams**, **blue teams**, and **security engineers** who need to understand how an attacker could move through their infrastructure.

<br>

## Key Features

<table>
<tr>
<td width="50%" valign="top">

### Network Discovery
- Automated asset discovery via **Nmap**
- Server, workstation, and network device classification
- IP and OS fingerprinting

### Attack Path Analysis
- **BFS algorithm** for shortest path discovery
- Step-by-step attack vector visualization
- Hop count and risk assessment per path

</td>
<td width="50%" valign="top">

### Interactive Graph
- **Cytoscape.js** powered visualization
- Node highlighting on click with neighbor discovery
- Drag-to-rearrange with zoom controls

### Risk Scoring
- Automated scoring based on **criticality × exposure × privileges**
- Domain Admin account detection
- Orphaned account identification

</td>
</tr>
</table>

<br>

## Tech Stack

<div align="center">

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 · TypeScript · Tailwind CSS v3 · shadcn/ui · Cytoscape.js · BentoGrid |
| **Backend** | Python · FastAPI · SQLAlchemy · Nmap |
| **Database** | PostgreSQL |
| **Icons** | Lucide React |

</div>

<br>

## Project Structure

```
attack-path-mapper/
├── backend/
│   ├── app/
│   │   ├── api/routes.py          # REST endpoints
│   │   ├── core/
│   │   │   ├── config.py          # Environment config
│   │   │   └── database.py        # PostgreSQL connection
│   │   ├── models/                # SQLAlchemy models
│   │   ├── services/
│   │   │   ├── graph.py           # Graph operations
│   │   │   ├── risk.py            # Risk scoring engine
│   │   │   └── discovery.py       # Nmap scanner
│   │   └── main.py                # FastAPI entry point
│   ├── requirements.txt
│   └── venv/
├── frontend/
│   ├── src/
│   │   ├── components/ui/         # shadcn/ui components
│   │   │   ├── badge.tsx
│   │   │   ├── bento-grid.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── select.tsx
│   │   │   └── table.tsx
│   │   ├── lib/utils.ts           # cn() utility
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx      # BentoGrid metrics
│   │   │   ├── Assets.tsx         # Asset management
│   │   │   ├── Users.tsx          # User management
│   │   │   ├── AttackPaths.tsx    # Path analysis
│   │   │   ├── GraphView.tsx      # Cytoscape.js graph
│   │   │   ├── Scans.tsx          # Nmap scanner
│   │   │   └── Reports.tsx        # Risk reports
│   │   ├── services/api.ts        # Axios API client
│   │   ├── App.tsx                # Router + Sidebar
│   │   └── index.css              # Tailwind theme
│   ├── tailwind.config.js
│   └── package.json
└── README.md
```

<br>

## Getting Started

### Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **PostgreSQL 14+**
- **Nmap** installed and in PATH

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/anjggti-eng/attack-path-mapper.git
cd attack-path-mapper/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Setup database schema
psql -U <user> -d <database> -c "CREATE SCHEMA IF NOT EXISTS attackpath;"

# Start the server
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Start development server
PORT=3001 npm start
```

### Docker (Production)

```bash
# From project root
docker-compose up -d
```

<br>

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard/stats` | Dashboard statistics |
| `GET` | `/api/assets` | List all assets |
| `POST` | `/api/assets` | Create new asset |
| `DELETE` | `/api/assets/{id}` | Delete asset |
| `GET` | `/api/users` | List all users |
| `POST` | `/api/users` | Create new user |
| `DELETE` | `/api/users/{id}` | Delete user |
| `GET` | `/api/relationships` | List relationships |
| `POST` | `/api/relationships` | Create relationship |
| `POST` | `/api/attack-paths/analyze` | Run BFS analysis |
| `GET` | `/api/attack-paths` | List attack paths |
| `GET` | `/api/scans` | List scans |
| `POST` | `/api/scans` | Start Nmap scan |
| `POST` | `/api/risk/calculate` | Calculate risk scores |
| `GET` | `/api/risk/summary` | Risk summary report |
| `GET` | `/api/graph` | Graph data (nodes + edges) |

<br>

## Pages

| Page | Description |
|------|-------------|
| **Dashboard** | BentoGrid layout with real-time security metrics |
| **Ativos** | CRUD for network assets with type and criticality filters |
| **Usuários** | User management with Domain Admin detection |
| **Caminhos** | Attack path analysis with step-by-step visualization |
| **Grafo** | Interactive Cytoscape.js graph with node highlighting |
| **Scan** | Nmap network discovery with scan history |
| **Relatórios** | Risk scoring dashboard with executive summary |

<br>

## Contributing

Contributions are welcome! Please open an issue first to discuss what you would like to change.

```bash
# Fork the repo
# Create your feature branch
git checkout -b feature/amazing-feature

# Commit your changes
git commit -m 'Add amazing feature'

# Push to the branch
git push origin feature/amazing-feature

# Open a Pull Request
```

<br>

## License

Distributed under the **MIT License**. See `LICENSE` for more information.

<br>

<div align="center">

**Built with care for the security community**

[⬆ back to top](#attack-path-mapper)

</div>
