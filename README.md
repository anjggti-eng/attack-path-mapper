# Attack Path Mapper

Plataforma open source de mapeamento de caminhos de ataque para infraestrutura de rede corporativa.

## Funcionalidades

- **Descoberta de Ativos** — Scan de rede via Nmap para identificar servidores, estações e dispositivos
- **Grafo de Relacionamentos** — Visualização interativa com Cytoscape.js mostrando dependências entre ativos
- **Análise de Caminhos de Ataque** — Algoritmo BFS para descobrir vetores de comprometimento
- **Score de Risco** — Cálculo automático baseado em criticidade, exposição e privilégios
- **Gestão de Usuários** — Mapeamento de contas com identificação de Domain Admins
- **Dashboard com BentoGrid** — Visão geral com cards animados usando shadcn/ui
- **Relatórios** — Métricas de risco e resumo executivo

## Stack

### Backend
- **FastAPI** — API REST assíncrona
- **PostgreSQL** — Banco de dados relacional
- **SQLAlchemy** — ORM com migrations
- **Nmap** — Descoberta de rede (via subprocess)

### Frontend
- **React 18** + TypeScript
- **Tailwind CSS v3** — Utilitários de estilo
- **shadcn/ui** — Componentes UI (Button, Card, Badge, Dialog, Table, Select)
- **Cytoscape.js** — Grafo de relacionamentos
- **BentoGrid** — Layout de dashboard com cards animados
- **Lucide React** — Ícones open source
- **React Router v6** — Roteamento SPA

## Arquitetura

```
attack-path-mapper/
├── backend/
│   ├── app/
│   │   ├── api/routes.py      # Endpoints REST
│   │   ├── core/config.py     # Configurações
│   │   ├── core/database.py   # Conexão PostgreSQL
│   │   └── main.py            # FastAPI app
│   ├── requirements.txt
│   └── venv/
├── frontend/
│   ├── src/
│   │   ├── components/ui/     # shadcn/ui components
│   │   ├── lib/utils.ts       # cn() utility
│   │   ├── pages/             # 7 páginas
│   │   ├── services/api.ts    # Axios client
│   │   ├── App.tsx            # Router + Sidebar
│   │   └── index.css          # Tailwind + theme
│   ├── tailwind.config.js
│   └── package.json
└── README.md
```

## Setup

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Criar schema no PostgreSQL
psql -U wa -d wa -c "CREATE SCHEMA IF NOT EXISTS attackpath;"
psql -U wa -d wa -c "SET search_path = attackpath, public;"

# Iniciar
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
PORT=3001 npm start
```

## API Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/dashboard/stats` | Estatísticas gerais |
| GET/POST | `/api/assets` | Listar/criar ativos |
| DELETE | `/api/assets/{id}` | Excluir ativo |
| GET/POST | `/api/users` | Listar/criar usuários |
| DELETE | `/api/users/{id}` | Excluir usuário |
| GET/POST | `/api/relationships` | Listar/criar relacionamentos |
| POST | `/api/attack-paths/analyze` | Analisar caminhos de ataque |
| GET | `/api/attack-paths` | Listar caminhos |
| GET/POST | `/api/scans` | Listar/iniciar scans |
| POST | `/api/risk/calculate` | Calcular scores de risco |
| GET | `/api/risk/summary` | Resumo de risco |
| GET | `/api/graph` | Dados do grafo (nodes + edges) |

## Screenshots

- **Dashboard** — BentoGrid com métricas de segurança em tempo real
- **Grafo** — Visualização interativa de ativos e relacionamentos
- **Caminhos de Ataque** — Análise BFS com steps detalhados
- **Relatórios** — Score de risco geral e relatório executivo

## Licença

MIT
