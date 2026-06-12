import React from 'react';
import { HeaderContainer, Button } from '../styles/AppStyles';

const Header: React.FC = () => {
  return (
    <HeaderContainer>
      <div>
        <h2 style={{ margin: 0, color: '#fff' }}>Attack Path Mapper</h2>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
          Visão geral da segurança da rede
        </p>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <Button variant="secondary">Exportar</Button>
        <Button>Nova Varredura</Button>
      </div>
    </HeaderContainer>
  );
};

export default Header;
