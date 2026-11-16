import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Activity, AlertTriangle, BarChart3, ClipboardList, CloudSun, FilePlus2, Gauge, LogOut, MapPin, MapPinned, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth/AuthContext';

const navigation = [
  { to: '/', label: 'Dashboard', icon: Gauge, end: true },
  { to: '/regions', label: 'Regions / Districts', icon: MapPinned },
  { to: '/zones', label: 'Monitoring Zones', icon: MapPin },
  { to: '/observations', label: 'Record Observation', icon: CloudSun },
  { to: '/generate', label: 'Generate Advisory', icon: FilePlus2 },
  { to: '/advisories', label: 'Alert & Advisory History', icon: AlertTriangle },
  { to: '/reports', label: 'Climate Reports', icon: BarChart3 },
  { to: '/model', label: 'About the Model', icon: Activity }
];

export default function AppLayout() {
  const [health, setHealth] = useState('checking');
  const location = useLocation();
  const { user, signOut } = useAuth();
  useEffect(() => {
    let active = true;
    api('/health').then((data) => active && setHealth(data.mongodbStatus === 'CONNECTED' ? 'connected' : 'disconnected'))
      .catch(() => active && setHealth('disconnected'));
    return () => { active = false; };
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark"><CloudSun size={24} strokeWidth={1.8} /></div>
          <div><strong>Heatwave<span>IQ</span></strong><small>Climate intelligence portal</small></div>
        </div>
        <div className="nav-section-label">WORKSPACE</div>
        <nav className="side-nav">
          {navigation.map((item) => {
            const Icon = item.icon;
            return <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Icon size={18} strokeWidth={1.8} /><span>{item.label}</span>
            </NavLink>;
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="model-chip"><ShieldCheck size={16} /><div><strong>CES-HW-RULES-v1.0</strong><small>Explainable rules engine</small></div></div>
          <div className="sidebar-note">Academic decision-support prototype. Not an official meteorological warning service.</div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="topbar-context"><span className="topbar-kicker">KJS-CES-01</span><span className="topbar-divider">/</span><span>Climate, Energy & Sustainability</span></div>
          <div className="topbar-right"><span className={`connection-pill ${health}`}><span className="connection-dot" />{health === 'connected' ? 'API & database connected' : health === 'checking' ? 'Checking connection' : 'API / database offline'}</span><span className="topbar-user">{user?.username} <small>{user?.roles?.join(', ')}</small></span><button className="signout-button" type="button" onClick={() => { signOut(); window.location.href = '/login'; }} title="Sign out"><LogOut size={15} /><span>Sign out</span></button><span className="topbar-date">{new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date())}</span></div>
        </header>
        <main className="page-content"><Outlet /></main>
        <footer className="app-footer"><span>Heatwave Alert & Advisory Portal</span><span>Academic prototype · K J Somaiya School of Engineering · AY 2026–27</span></footer>
      </div>
    </div>
  );
}
