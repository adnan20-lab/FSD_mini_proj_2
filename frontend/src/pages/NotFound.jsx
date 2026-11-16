import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
export default function NotFound() { return <div className="not-found"><span>404</span><h1>Page not found</h1><p>The requested page is not part of the Heatwave Alert & Advisory Portal.</p><Link className="button button-primary" to="/"><ArrowLeft size={15} /> Return to dashboard</Link></div>; }
