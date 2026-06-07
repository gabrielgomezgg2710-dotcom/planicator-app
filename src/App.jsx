import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';

import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientBrief from './pages/ClientBrief';
import Planning from './pages/Planning';
import Review from './pages/Review';
import History from './pages/History';
import Publish from './pages/Publish';
import Settings from './pages/Settings';

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        {children}
      </main>
    </div>
  );
}

function AppRoutes() {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
        <Route path="/clients" element={<AppLayout><Clients /></AppLayout>} />
        <Route path="/clients/:id" element={<AppLayout><ClientBrief /></AppLayout>} />
        <Route path="/planning" element={<AppLayout><Planning /></AppLayout>} />
        <Route path="/review" element={<AppLayout><Review /></AppLayout>} />
        <Route path="/history" element={<AppLayout><History /></AppLayout>} />
        <Route path="/publish" element={<AppLayout><Publish /></AppLayout>} />
        <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toast />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
