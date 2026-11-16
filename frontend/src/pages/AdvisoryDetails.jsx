import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock3, MapPin, ShieldAlert } from 'lucide-react';
import { api } from '../api';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { EmptyState, ErrorNotice, Loading, SuccessNotice } from '../components/Feedback';
import { formatDate, formatEnum } from '../utils';

export default function AdvisoryDetails() {
  const { id } = useParams(); const [item, setItem] = useState(null); const [error, setError] = useState(''); const [success, setSuccess] = useState(''); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  async function load() { try { setItem(await api(`/advisories/${id}`)); } catch (e) { setError(e.message); } finally { setLoading(false); } }
  useEffect(() => { load(); }, [id]);
  async function acknowledge() { setSaving(true); setError(''); setSuccess(''); try { const saved = await api(`/advisories/${id}/acknowledge`, { method: 'PATCH' }); setItem(saved); setSuccess('Acknowledgement recorded. Alert severity and saved rule results remain unchanged.'); } catch (e) { setError(e.message); } finally { setSaving(false); } }
  if (loading) return <Loading />;
  if (!item) return <><ErrorNotice message={error || 'Advisory not found.'} /><Link className="button button-ghost" to="/advisories"><ArrowLeft size={16} /> Back to history</Link></>;
  const snapshot = item.inputSnapshot || {};
  return <>
    <PageHeader eyebrow={`ADVISORY · ${item.modelVersion}`} title={item.zoneNameSnapshot || 'Heatwave advisory'} description={`${item.regionNameSnapshot || 'Region'} · generated ${formatDate(item.createdAt)}`} action={<Link className="button button-ghost" to={`/zones/${item.zoneId}`}><MapPin size={15} /> Open zone</Link>} />
    <ErrorNotice message={error} /><SuccessNotice message={success} />
    <section className="panel advisory-hero"><div className="advisory-hero-top"><div className="advisory-hero-icon"><ShieldAlert size={25} /></div><div className="advisory-hero-copy"><span className="eyebrow">RULE ENGINE DECISION</span><h2><StatusBadge status={item.alertStatus} /></h2><p>Alert classification is separate from the administrative review status.</p></div><div className="acknowledge-block">{item.acknowledgementStatus === 'ACKNOWLEDGED' ? <span className="review-state acknowledged"><CheckCircle2 size={15} /> Acknowledged by {item.acknowledgedBy || 'Civic Authority'}</span> : <><span className="review-state pending">Pending acknowledgement</span><button className="button button-primary button-small" onClick={acknowledge} disabled={saving}>{saving ? 'Saving…' : 'Mark acknowledged'}</button></>}</div></div><p className="result-reasoning">{item.reasoning}</p><div className="advisory-timeline"><div><small>Observation timestamp</small><strong>{formatDate(item.observationAt)}</strong></div><div><small>Advisory generation timestamp</small><strong>{formatDate(item.createdAt)}</strong></div><div><small>Next prototype evaluation</small><strong>{formatDate(item.nextEvaluationAt)}</strong></div></div></section>
    <div className="result-metrics detail-result-metrics"><ResultMetric label="Observed max." value={`${snapshot.maxTemperature ?? '—'}°C`} /><ResultMetric label="Observed min." value={`${snapshot.minTemperature ?? '—'}°C`} /><ResultMetric label="Relative humidity" value={`${snapshot.relativeHumidity ?? '—'}%`} /><ResultMetric label="Heat Index" value={`${item.heatIndex ?? '—'}°C`} /><ResultMetric label="Temperature departure" value={`${item.temperatureDeparture > 0 ? '+' : ''}${item.temperatureDeparture ?? '—'}°C`} /><ResultMetric label="Terrain threshold" value={`${item.terrainThreshold ?? '—'}°C`} /><ResultMetric label="Outdoor restriction" value={item.outdoorRestrictionHours == null ? 'Not calculated' : `${item.outdoorRestrictionHours} hours`} /><ResultMetric label="Cooling center hours" value={item.coolingCenterOperatingHours == null ? 'Not calculated' : `${item.coolingCenterOperatingHours} hours`} /><ResultMetric label="Grid demand surge estimate" value={item.estimatedGridDemandSurgePercent == null ? 'Not calculated' : `${item.estimatedGridDemandSurgePercent}%`} />
    </div>
    {item.alertStatus !== 'NORMAL_CONDITIONS' && item.alertStatus !== 'REVIEW_REQUIRED' && <div className="info-strip"><span className="info-strip-icon"><Clock3 size={17} /></span><div><strong>Peak exposure window</strong><p>{item.peakExposureWindow}. Cooling-center hours and grid-demand surge are illustrative planning estimates, not certified operational forecasts.</p></div></div>}
    <section className="panel"><div className="panel-heading"><div><h3>Sector-specific civic actions</h3><p>Recommended checklist generated for this alert level</p></div></div><div className="sector-grid">{Object.entries(item.sectorActions || {}).map(([sector, actions]) => <div className="sector-card" key={sector}><h4>{sector}</h4><ul>{actions.map((action) => <li key={action}>{action}</li>)}</ul></div>)}</div></section>
    <div className="dashboard-grid">
      <section className="panel detail-card"><div className="panel-heading"><div><h3>Applied rule details</h3><p>Deterministic rule identifiers</p></div></div>{item.appliedRules?.length ? <ul className="rule-list">{item.appliedRules.map((rule) => <li key={rule}><span className="rule-check">✓</span><span><strong>{formatEnum(rule)}</strong><small>{rule}</small></span></li>)}</ul> : <EmptyState />}</section>
      <section className="panel detail-card"><div className="panel-heading"><div><h3>Input snapshot</h3><p>Values retained for historical interpretability</p></div></div><dl className="detail-list compact-detail-list">{Object.entries(snapshot).map(([key, value]) => <div key={key}><dt>{formatEnum(key)}</dt><dd>{value == null ? '—' : typeof value === 'object' ? formatDate(value) : String(value)}</dd></div>)}</dl></section>
    </div>
    <div className="record-links"><Link to={`/zones/${item.zoneId}`}><MapPin size={15} /> Monitoring zone profile</Link><Link to={`/observations?zoneId=${item.zoneId}`}><ArrowLeft className="arrow-up" size={15} /> Observation history</Link><Link to={`/observations/${item.observationId}`}><ArrowLeft className="arrow-up" size={15} /> Related observation: {item.observationId?.slice(0, 12)}</Link></div>
    <Link className="back-link" to="/advisories"><ArrowLeft size={15} /> Back to advisory history</Link>
  </>;
}
function ResultMetric({ label, value }) { return <div><span>{label}</span><strong>{value}</strong></div>; }
