import styled from 'styled-components';

export const AppContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background: #0a0e17;
  color: #e0e0e0;
`;

export const MainContent = styled.main`
  flex: 1;
  margin-left: 250px;
  padding: 20px;
`;

export const SidebarContainer = styled.aside`
  width: 250px;
  background: #111827;
  border-right: 1px solid #1f2937;
  position: fixed;
  height: 100vh;
  display: flex;
  flex-direction: column;
`;

export const Logo = styled.div`
  padding: 20px;
  border-bottom: 1px solid #1f2937;
  h1 {
    font-size: 1.2rem;
    color: #3b82f6;
    margin: 0;
  }
  p {
    font-size: 0.75rem;
    color: #6b7280;
    margin: 5px 0 0;
  }
`;

export const NavMenu = styled.nav`
  flex: 1;
  padding: 20px 0;
`;

export const NavItem = styled.a<{ active?: boolean }>`
  display: flex;
  align-items: center;
  padding: 12px 20px;
  color: ${props => props.active ? '#3b82f6' : '#9ca3af'};
  text-decoration: none;
  transition: all 0.2s;
  cursor: pointer;

  &:hover {
    background: #1f2937;
    color: #3b82f6;
  }

  svg {
    margin-right: 12px;
    width: 20px;
    height: 20px;
  }
`;

export const HeaderContainer = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #1f2937;
  margin-bottom: 20px;
`;

export const Card = styled.div`
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
`;

export const CardTitle = styled.h3`
  color: #9ca3af;
  font-size: 0.875rem;
  text-transform: uppercase;
  margin: 0 0 10px;
`;

export const CardValue = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #fff;
`;

export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
`;

export const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  background: ${props => {
    switch (props.variant) {
      case 'danger': return '#ef4444';
      case 'secondary': return '#374151';
      default: return '#3b82f6';
    }
  }};
  color: white;

  &:hover {
    opacity: 0.9;
  }
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: #111827;
  border-radius: 8px;
  overflow: hidden;
`;

export const Th = styled.th`
  background: #1f2937;
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #9ca3af;
  font-size: 0.75rem;
  text-transform: uppercase;
`;

export const Td = styled.td`
  padding: 12px 16px;
  border-bottom: 1px solid #1f2937;
`;

export const Badge = styled.span<{ variant?: 'success' | 'warning' | 'danger' | 'info' }>`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  background: ${props => {
    switch (props.variant) {
      case 'success': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'danger': return '#ef4444';
      default: return '#3b82f6';
    }
  }};
  color: white;
`;

export const GraphContainer = styled.div`
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 8px;
  height: 600px;
  position: relative;
`;

export const FilterBar = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

export const Select = styled.select`
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #374151;
  background: #1f2937;
  color: #e0e0e0;
  font-size: 0.875rem;
`;

export const Input = styled.input`
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #374151;
  background: #1f2937;
  color: #e0e0e0;
  font-size: 0.875rem;
`;
