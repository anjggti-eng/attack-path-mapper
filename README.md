<div align="center">

# Attack Path Mapper

### Plataforma Open Source de Análise e Visualização de Caminhos de Ataque

[![License: MIT](https://img.shields.io/badge/Licença-MIT-blue.svg)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10+-3776AB.svg)](https://python.org)
[![React 18](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-009688.svg)](https://fastapi.tiangolo.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v3-06B6D4.svg)](https://tailwindcss.com)
[![shadcn/ui](https://img.shields.io/badge/shadcn/ui-Component_Library-white.svg)](https://ui.shadcn.com)

[**Como começar →**](#-início-rápido) · [**Reportar Bug**](https://github.com/anjggti-eng/attack-path-mapper/issues) · [**Solicitar Feature**](https://github.com/anjggti-eng/attack-path-mapper/issues)

</div>

---

<br>

## Visão Geral

O Attack Path Mapper é uma plataforma **self-hosted e open source** que descobre ativos de uma organização, mapeia seus relacionamentos, identifica vetores de ataque usando teoria dos grafos e visualiza tudo em um dashboard interativo em tempo real.

Feito para **red teams**, **blue teams** e **engenheiros de segurança** que precisam entender como um atacante poderia se mover pela infraestrutura.

<br>

## Funcionalidades

<table>
<tr>
<td width="50%" valign="top">

### Descoberta de Rede
- Descoberta automatizada de ativos via **Nmap**
- Classificação de servidores, estações e dispositivos
- Fingerprint de IP e sistema operacional

### Análise de Caminhos de Ataque
- Algoritmo **BFS** para descoberta do menor caminho
- Visualização passo a passo do vetor de ataque
- Contagem de hops e avaliação de risco por caminho

</td>
<td width="50%" valign="top">

### Grafo Interativo
- Visualização com **Cytoscape.js**
- Destaque de nós ao clicar com descoberta de vizinhos
- Arrastar para reposicionar com controles de zoom

### Score de Risco
- Cálculo automático baseado em **criticidade × exposição × privilégios**
- Detecção de contas Domain Admin
- Identificação de contas órfãs

</td>
</tr>
</table>

<br>

## Stack Tecnológica

<div align="center">

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | React 18 · TypeScript · Tailwind CSS v3 · shadcn/ui · Cytoscape.js · BentoGrid |
| **Backend** | Python · FastAPI · SQLAlchemy · Nmap |
| **Banco de Dados** | PostgreSQL |
| **Ícones** | Lucide React |

</div>

<br>

## Estrutura do Projeto

```
attack-path-mapper/
├── backend/
│   ├── app/
│   │   ├── api/routes.py          # Endpoints REST
│   │   ├── core/
│   │   │   ├── config.py          # Configurações
│   │   │   └── database.py        # Conexão PostgreSQL
│   │   ├── models/                # Modelos SQLAlchemy
│   │   ├── services/
│   │   │   ├── graph.py           # Operações de grafo
│   │   │   ├── risk.py            # Motor de score de risco
│   │   │   └── discovery.py       # Scanner Nmap
│   │   └── main.py                # Ponto de entrada FastAPI
│   ├── requirements.txt
│   └── venv/
├── frontend/
│   ├── src/
│   │   ├── components/ui/         # Componentes shadcn/ui
│   │   │   ├── badge.tsx
│   │   │   ├── bento-grid.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── select.tsx
│   │   │   └── table.tsx
│   │   ├── lib/utils.ts           # Utilitário cn()
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx      # Métricas BentoGrid
│   │   │   ├── Assets.tsx         # Gestão de ativos
│   │   │   ├── Users.tsx          # Gestão de usuários
│   │   │   ├── AttackPaths.tsx    # Análise de caminhos
│   │   │   ├── GraphView.tsx      # Grafo Cytoscape.js
│   │   │   ├── Scans.tsx          # Scanner Nmap
│   │   │   └── Reports.tsx        # Relatórios de risco
│   │   ├── services/api.ts        # Cliente Axios
│   │   ├── App.tsx                # Router + Sidebar
│   │   └── index.css              # Tema Tailwind
│   ├── tailwind.config.js
│   └── package.json
└── README.md
```

<br>

## Início Rápido

### Pré-requisitos

- **Python 3.10+**
- **Node.js 18+**
- **PostgreSQL 14+**
- **Nmap** instalado e no PATH

### Configuração do Backend

```bash
# Clonar o repositório
git clone https://github.com/anjggti-eng/attack-path-mapper.git
cd attack-path-mapper/backend

# Criar ambiente virtual
python3 -m venv venv
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Configurar schema do banco
psql -U <usuario> -d <banco> -c "CREATE SCHEMA IF NOT EXISTS attackpath;"

# Iniciar o servidor
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Configuração do Frontend

```bash
cd ../frontend

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
PORT=3001 npm start
```

### Docker (Produção)

```bash
# Da raiz do projeto
docker-compose up -d
```

<br>

## Referência da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/dashboard/stats` | Estatísticas do dashboard |
| `GET` | `/api/assets` | Listar todos os ativos |
| `POST` | `/api/assets` | Criar novo ativo |
| `DELETE` | `/api/assets/{id}` | Excluir ativo |
| `GET` | `/api/users` | Listar todos os usuários |
| `POST` | `/api/users` | Criar novo usuário |
| `DELETE` | `/api/users/{id}` | Excluir usuário |
| `GET` | `/api/relationships` | Listar relacionamentos |
| `POST` | `/api/relationships` | Criar relacionamento |
| `POST` | `/api/attack-paths/analyze` | Executar análise BFS |
| `GET` | `/api/attack-paths` | Listar caminhos de ataque |
| `GET` | `/api/scans` | Listar scans |
| `POST` | `/api/scans` | Iniciar scan Nmap |
| `POST` | `/api/risk/calculate` | Calcular scores de risco |
| `GET` | `/api/risk/summary` | Resumo de risco |
| `GET` | `/api/graph` | Dados do grafo (nós + arestas) |

<br>

## Páginas

| Página | Descrição |
|--------|-----------|
| **Dashboard** | Layout BentoGrid com métricas de segurança em tempo real |
| **Ativos** | CRUD de ativos com filtros por tipo e criticidade |
| **Usuários** | Gestão de usuários com detecção de Domain Admin |
| **Caminhos** | Análise de caminhos de ataque com visualização passo a passo |
| **Grafo** | Grafo interativo Cytoscape.js com destaque de nós |
| **Scan** | Descoberta de rede Nmap com histórico de scans |
| **Relatórios** | Dashboard de score de risco com resumo executivo |

<br>

## Contribuindo

Contribuições são bem-vindas! Abra uma issue primeiro para discutir o que você gostaria de alterar.

```bash
# Fork o repositório
# Crie sua branch de feature
git checkout -b feature/amazing-feature

# Commit suas alterações
git commit -m 'Adicionar feature incrível'

# Push para a branch
git push origin feature/amazing-feature

# Abra um Pull Request
```

<br>

## Licença

Distribuído sob a **Licença MIT**. Veja `LICENSE` para mais informações.

<br>

<div align="center">

**Feito com cuidado para a comunidade de segurança**

[⬆ voltar ao topo](#attack-path-mapper)

</div>
