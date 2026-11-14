import React from 'react';
import ReactDOM from 'react-dom/client';
import ServiceShell, { ServiceErrorBoundary } from './ServiceShell';
import '@fontsource-variable/noto-sans-kr';
import '@fontsource/barlow-condensed/500.css';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import '@fontsource/barlow-condensed/800.css';
import './styles.css';
import './ux.css';
import './service.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ServiceErrorBoundary>
      <ServiceShell />
    </ServiceErrorBoundary>
  </React.StrictMode>,
);
