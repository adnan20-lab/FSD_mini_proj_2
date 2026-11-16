import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Edit2, FilePlus2, MapPin } from 'lucide-react';
import { api } from '../api';
import PageHeader from '../components/PageHeader';
import { EmptyState, ErrorNotice, Loading } from '../components/Feedback';
import { formatDate } from '../utils';

export default function ObservationDetails() {
  const { id } = useParams(); const [observation, setObservation] = useState(null); const [zone, setZone] = useState(null); const [advisories, setAdvisories] = useState([]); const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { try { const o = await api(`/observations/${id}`); setObservation(o); const [z, a] = await Promise.all([api(`/zones/${o.zoneId}`), api(`/advisories?zoneId=${o.zoneId}`)]); setZone(z); setAdvisories(a.filter((x) => x.observationId === id)); } catch (e) { setError(e.message); } finally { setLoading(false); } })(); }, [id]);
  if (loading) return <Loading />;
  if (!observation) return <><ErrorNotice message={error || 'Observation not found.'} /><Link className="button button-ghost" to="/observations"><ArrowLeft size={15} /> Back to observations</Link></>;
  return <>
    <PageHeader eyebrow="MANUAL METEOROLOGICAL RECORD" title="Observation details" description={`Observed ${formatDate(observation.observedAt)} · created ${formatDate(observation.createdAt)}`} action={<><Link className="button button-ghost" to={`/observations?zoneId=${observation.zoneId}`}><Edit2 size={15} /> Observation history</Link><Link className="button button-primary" to={`/generate?observationId=${id}`}><FilePlus2 size={15} /> Generate advisory</Link></>} />
    <ErrorNotice message={error} />
    <section className="panel detail-card"><div className="panel-heading"><div><h3>Recorded measurements</h3><p>Manually entered source record — not an automated sensor stream</p></div><span className="manual-tag">MANUAL ENTRY</span></div><div className="result-metrics detail-result-metrics"><Metric label="Daytime maximum" value={`${observation.maxTemperature}°C`} /><Metric label="Nighttime minimum" value={`${observation.minTemperature}°C`} /><Metric label="Relative humidity" value={`${observation.relativeHumidity}%`} /><Metric label="Wind speed" value={`${observation.windSpeedKmh} km/h`} /><Metric label="Consecutive hot days" value={observation.consecutiveHotDays} /><Metric label="UV index" value={observation.uvIndex ?? 'Not recorded'} /></div><dl className="detail-list"><div><dt>Observation timestamp</dt><dd>{formatDate(observation.observedAt)}</dd></div><div><dt>Created timestamp</dt><dd>{formatDate(observation.createdAt)}</dd></div><div><dt>Observation ID</dt><dd className="mono-text">{observation.id}</dd></div><div><dt>Zone ID</dt><dd><Link className="table-primary-link" to={`/zones/${observation.zoneId}`}>{zone?.zone.name || observation.zoneId}</Link></dd></div></dl>{observation.solarRadiationNotes && <div className="notes-box">Solar / radiation notes: {observation.solarRadiationNotes}</div>}{observation.fieldNotes && <div className="notes-box">Field notes: {observation.fieldNotes}</div>}</section>
    <section className="panel table-panel"><div className="panel-heading"><div><h3>Advisories generated from this observation</h3><p>Existing advisories retain the snapshot from the time they were generated.</p></div></div>{!advisories.length ? <EmptyState title="No linked advisory yet" description="Generate an advisory from this persisted observation." /> : <div className="compact-list">{advisories.map((a) => <Link key={a.id} className="compact-row compact-link" to={`/advisories/${a.id}`}><div className="compact-main"><strong>{a.alertStatus.replaceAll('_', ' ')}</strong><small>Generated {formatDate(a.createdAt)}</small></div><span className="text-link">Open advisory →</span></Link>)}</div>}</section>
    <div className="record-links"><Link to={`/zones/${observation.zoneId}`}><MapPin size={15} /> Monitoring zone profile</Link><Link to={`/observations?zoneId=${observation.zoneId}`}><ArrowLeft className="arrow-up" size={15} /> Zone observation history</Link></div>
  </>;
}
function Metric({ label, value }) { return <div><span>{label}</span><strong>{value}</strong></div>; }
