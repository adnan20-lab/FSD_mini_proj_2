import { AlertCircle, CheckCircle2, LoaderCircle } from 'lucide-react';

export function ErrorNotice({ message }) {
  if (!message) return null;
  return <div className="notice notice-error"><AlertCircle size={17} /><span>{message}</span></div>;
}

export function SuccessNotice({ message }) {
  if (!message) return null;
  return <div className="notice notice-success"><CheckCircle2 size={17} /><span>{message}</span></div>;
}

export function Loading({ label = 'Loading data…' }) {
  return <div className="loading-state"><LoaderCircle className="spin" size={20} /><span>{label}</span></div>;
}

export function EmptyState({ title = 'No records yet', description = 'Records will appear here after they are created.' }) {
  return <div className="empty-state"><div className="empty-icon"><AlertCircle size={20} /></div><h3>{title}</h3><p>{description}</p></div>;
}
