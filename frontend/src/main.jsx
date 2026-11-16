import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import Dashboard from './pages/Dashboard';
import Regions from './pages/Regions';
import RegionDetails from './pages/RegionDetails';
import Zones from './pages/Zones';
import ZoneDetails from './pages/ZoneDetails';
import Observations from './pages/Observations';
import ObservationDetails from './pages/ObservationDetails';
import GenerateAdvisory from './pages/GenerateAdvisory';
import Advisories from './pages/Advisories';
import AdvisoryDetails from './pages/AdvisoryDetails';
import Reports from './pages/Reports';
import Model from './pages/Model';
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import Register from './pages/Register';
import { AuthProvider } from './auth/AuthContext';
import RequireAuth from './auth/RequireAuth';
import './styles.css';

function App() {
  return <AuthProvider><BrowserRouter><Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
      <Route index element={<Dashboard />} />
      <Route path="regions" element={<Regions />} />
      <Route path="regions/:id" element={<RegionDetails />} />
      <Route path="zones" element={<Zones />} />
      <Route path="zones/:id" element={<ZoneDetails />} />
      <Route path="observations" element={<Observations />} />
      <Route path="observations/:id" element={<ObservationDetails />} />
      <Route path="generate" element={<GenerateAdvisory />} />
      <Route path="advisories" element={<Advisories />} />
      <Route path="advisories/:id" element={<AdvisoryDetails />} />
      <Route path="reports" element={<Reports />} />
      <Route path="model" element={<Model />} />
      <Route path="*" element={<NotFound />} />
    </Route>
  </Routes></BrowserRouter></AuthProvider>;
}

ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
