import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ClipboardList, CloudSun, FilePlus2, MapPin } from 'lucide-react';
import { api } from '../api';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { EmptyState, ErrorNotice, Loading } from '../components/Feedback';
import { formatDate, formatEnum } from '../utils';

export default function ZoneDetails() {
  const { id } = useParams(); const [item, setItem] = useState(null); const [modelConfig, setModelConfig] = useState(null); const [observations, setObservations] = useState([]); const [advisories, setAdvisories] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  useEffect(() => { Promise.all([api(`/zones/${id}`), api(`/observations?zoneId=${id}`), api(`/advisories?zoneId=${id}`), api('/model/config')]).then(([z, o, a, config]) => { setItem(z); setObservations(o); setAdvisories(a); setModelConfig(config); }).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, [id]);
  if (loading) return <Loading />;
  if (!item) return <><ErrorNotice message={error || 'Zone not found.'} /><Link className="button button-ghost" to="/zones"><ArrowLeft size={16} /> Back to zones</Link></>;
  const zone = item.zone;
  return <>
    <PageHeader eyebrow="MONITORING ZONE" title={zone.name} description={`${item.regionName} · ${formatEnum(zone.landUseType)} · ${formatEnum(zone.vulnerabilityLevel)} vulnerability`} action={<><Link className="button button-ghost" to={`/observations?zoneId=${id}`}><CloudSun size={16} /> Record observation</Link><Link className="button button-primary" to={`/generate?zoneId=${id}`}><FilePlus2 size={16} /> Generate advisory</Link></>} />
    <ErrorNotice message={error} />
    <div className="metric-grid detail-metrics"><Metric label="Population" value={Number(zone.estimatedPopulation).toLocaleString('en-IN')} /><Metric label="Area" value={`${zone.areaSqKm} sq. km`} /><Metric label="Baseline max. temperature" value={`${zone.baselineMaxTemperature}°C`} /><Metric label="Terrain threshold" value={`${modelConfig?.terrainThresholds?.[item.terrainType]?.toFixed(1) ?? '—'}°C`} /></div>
    <div className="dashboard-grid">
      <section className="panel detail-card"><div className="detail-card-title"><div className="metric-icon teal"><MapPin size={18} /></div><div><h3>Zone profile</h3><p>Environmental and vulnerability attributes</p></div></div><dl className="detail-list"><div><dt>Parent authority</dt><dd>{item.regionName}</dd></div><div><dt>Land use</dt><dd>{formatEnum(zone.landUseType)}</dd></div><div><dt>Vulnerability</dt><dd>{formatEnum(zone.vulnerabilityLevel)}</dd></div><div><dt>Cooling infrastructure</dt><dd>{formatEnum(zone.coolingInfrastructure)}</dd></div><div><dt>Created</dt><dd>{formatDate(zone.createdAt)}</dd></div><div><dt>Last updated</dt><dd>{formatDate(zone.updatedAt)}</dd></div></dl>{zone.notes && <div className="notes-box">{zone.notes}</div>}</section>
      <section className="panel detail-card"><div className="detail-card-title"><div className="metric-icon orange"><CloudSun size={18} /></div><div><h3>Latest conditions</h3><p>Most recent saved manual observation</p></div></div>{item.latestObservation ? <><div className="weather-reading"><strong>{item.latestObservation.maxTemperature}°C</strong><span>Maximum temperature</span></div><div className="reading-grid"><span>Night min. <b>{item.latestObservation.minTemperature}°C</b></span><span>Humidity <b>{item.latestObservation.relativeHumidity}%</b></span><span>Wind <b>{item.latestObservation.windSpeedKmh} km/h</b></span><span>Hot days <b>{item.latestObservation.consecutiveHotDays}</b></span></div><p className="muted">Observation recorded {formatDate(item.latestObservation.observedAt)}</p></> : <EmptyState title="No observation recorded" description="Record a manual meteorological observation for this zone." />}{item.latestAdvisory && <div className="latest-alert-box"><div><small>LATEST ALERT</small><StatusBadge status={item.latestAdvisory.alertStatus} /></div><Link to={`/advisories/${item.latestAdvisory.id}`}>View advisory <ArrowLeft className="arrow-rotate" size={14} /></Link></div>}</section>
    </div>
    <div className="dashboard-grid lower-grid">
      <section className="panel"><div className="panel-heading"><div><h3>Observation history</h3><p>{observations.length} saved observations</p></div><Link to={`/observations?zoneId=${id}`} className="text-link">Open recorder <ArrowLeft className="arrow-rotate" size={14} /></Link></div>{observations.length === 0 ? <EmptyState /> : <div className="compact-list">{observations.slice(0, 5).map((o) => <div className="compact-row" key={o.id}><div className="compact-main"><strong>{o.maxTemperature}°C / {o.minTemperature}°C</strong><small>{formatDate(o.observedAt)}</small></div><div className="compact-side"><strong>{o.relativeHumidity}%</strong><small>RH</small></div></div>)}</div>}</section>
      <section className="panel"><div className="panel-heading"><div><h3>Advisory history</h3><p>{advisories.length} generated decisions</p></div><Link to={`/advisories?zoneId=${id}`} className="text-link">Open history <ArrowLeft className="arrow-rotate" size={14} /></Link></div>{advisories.length === 0 ? <EmptyState /> : <div className="compact-list">{advisories.slice(0, 5).map((a) => <Link key={a.id} to={`/advisories/${a.id}`} className="compact-row compact-link"><div className="compact-main"><strong>{formatDate(a.createdAt)}</strong><small>Observation: {formatDate(a.observationAt)}</small></div><StatusBadge status={a.alertStatus} /></Link>)}</div>}</section>
    </div>
    <Link className="back-link" to="/zones"><ArrowLeft size={15} /> Back to zones</Link>
  </>;
}
function Metric({ label, value }) { return <div className="metric-card compact-metric"><div className="metric-copy"><span>{label}</span><strong>{value}</strong></div></div>; }
