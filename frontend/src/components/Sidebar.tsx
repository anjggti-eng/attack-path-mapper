import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SidebarContainer, Logo, NavMenu, NavItem } from '../styles/AppStyles';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/graph', label: 'Mapa de Grafos', icon: '🗺️' },
    { path: '/assets', label: 'Ativos', icon: '🖥️' },
    { path: '/users', label: 'Usuários', icon: '👥' },
    { path: '/attack-paths', label: 'Caminhos de Ataque', icon: '🎯' },
    { path: '/scans', label: 'Varreduras', icon: '🔍' },
    { path: '/reports', label: 'Relatórios', icon: '📋' },
  ];

  return (
    <SidebarContainer>
      <Logo>
        <h1>Attack Path Mapper</h1>
        <p>Mapeamento de Caminhos de Ataque</p>
      </Logo>
      <NavMenu>
        {menuItems.map((item) => (
          <NavItem
            key={item.path}
            active={location.pathname === item.path}
            onClick={() => navigate(item.path)}
          >
            <span>{item.icon}</span>
            {item.label}
          </NavItem>
        ))}
      </NavMenu>
    </SidebarContainer>
  );
};

export default Sidebar;
