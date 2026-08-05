import React from 'react';
import ReactDOM from 'react-dom/client';
import SidebarNavPreview from './components/ui/dashboard-sidebar';
import './style.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SidebarNavPreview />
  </React.StrictMode>
);
