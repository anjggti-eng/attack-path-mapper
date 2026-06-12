import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Shield, LayoutDashboard, Box, Users, GitBranch, BarChart3, Radar, FileText } from 'lucide-react';
import { cn } from './lib/utils';
import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import UsersPage from './pages/Users';
import AttackPaths from './pages/AttackPaths';
import GraphView from './pages/GraphView';
import Scans from './pages/Scans';
import Reports from './pages/Reports';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/assets', label: 'Ativos', icon: Box },
  { to: '/users', label: 'Usuários', icon: Users },
  { to: '/attack-paths', label: 'Caminhos', icon: GitBranch },
  { to: '/graph', label: 'Grafo', icon: BarChart3 },
  { to: '/scans', label: 'Scan', icon: Radar },
  { to: '/reports', label: 'Relatórios', icon: FileText },
];

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-background">
        <aside className="fixed left-0 top-0 bottom-0 w-60 border-r border-border bg-card z-50 flex flex-col">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-semibold leading-none">Attack Path Mapper</h1>
              <p className="text-[10px] text-muted-foreground mt-0.5">Open Source Security</p>
            </div>
          </div>
          <nav className="flex-1 p-2 space-y-0.5">
            {links.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )
                }
              >
                <l.icon className="h-4 w-4" />
                <span>{l.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="flex-1 ml-60 p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/assets" element={<Assets />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/attack-paths" element={<AttackPaths />} />
            <Route path="/graph" element={<GraphView />} />
            <Route path="/scans" element={<Scans />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
