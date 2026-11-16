import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, FilePlus2, ShieldAlert, ThermometerSun } from 'lucide-react';
import { api, jsonBody } from '../api';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { ErrorNotice, Loading } from '../components/Feedback';
import { formatDate, formatEnum } from '../utils';

export default function GenerateAdvisory() {
  const [searchParams] = useSearchParams(); const queryObservationId = searchParams.get('observationId') || ''; const queryZoneId = searchParams.get('zoneId') || '';
  const [observations, setObservations] = useState([]); const [zones, setZones] = useState([]); const [observationId, setObservationId] = useState(queryObservationId);
  const [advisory, setAdvisory] = useState(null); const [loading, setLoading] = useState(true); const [generating, setGenerating] = useState(false); const [error, setError] = useState('');
  useEffect(() => {
    Promise.all([api('/observations'), api('/zones')]).then(([o, z]) => { setObservations(o); setZones(z); if (!queryObservationId) { const targetZone = queryZoneId ? o.find((x) => x.zoneId === queryZoneId) : null; setObservationId(targetZone?.id || o[0]?.id || ''); } }).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);
  useEffect(() => { if (queryObservationId) setObservationId(queryObservationId); }, [queryObservationId]);
  const selected = observations.find((o) => o.id === observationId);
  const zone = zones.find((z) => z.zone.id === selected?.zoneId);

  async function generate(e) {
    e.preventDefault(); setError(''); setAdvisory(null);
    if (!observationId || !selected) { setError('Choose a saved observation. New unsaved form values cannot be used to generate an advisory.'); return; }
    setGenerating(true);
    try { setAdvisory(await api('/advisories/generate', { method: 'POST', body: jsonBody({ observationId }) })); }
    catch (e2) { setError(e2.message); }
    finally { setGenerating(false); }
  }

  if (loading) return <Loading label="Loading saved observations…" />;
  return <>
    <PageHeader eyebrow="DETERMINISTIC CLIMATE INTELLIGENCE" title="Generate heatwave advisory" description="Run the backend rule engine against a persisted observation and the associated zone and region context. Every run is saved as a new historical advisory." />
    <ErrorNotice message={error} />
    <div className="generate-layout">
      <section className="panel generate-panel">
        <div className="panel-heading"><div><h3>Select a saved observation</h3><p>Only records already stored in MongoDB are eligible.</p></div><div className="engine-icon"><ShieldAlert size={20} /></div></div>
        {!observations.length ? <div className="no-observation"><div className="empty-icon"><ThermometerSun size={22} /></div><h3>No saved observations available</h3><p>Record and save a meteorological observation first. The engine will never classify unsaved form values.</p><Link className="button button-primary" to="/observations">Record observation <ArrowRight size={15} /></Link></div> : <form onSubmit={generate}>
          <label className="form-field"><span>Saved observation <b className="required">*</b></span><select value={observationId} onChange={(e) => { setObservationId(e.target.value); setAdvisory(null); }} required><option value="">Select observation</option>{observations.map((o) => <option key={o.id} value={o.id}>{zones.find((z) => z.zone.id === o.zoneId)?.zone.name || o.zoneId} · {formatDate(o.observedAt)} · {o.maxTemperature}°C / {o.minTemperature}°C</option>)}</select></label>
          {selected && <div className="selected-observation"><div className="selected-observation-head"><strong>{zone?.zone.name || 'Monitoring zone'}</strong><span className="manual-tag">SAVED MANUAL RECORD</span></div><div className="selected-grid"><div><small>Observation time</small><strong>{formatDate(selected.observedAt)}</strong></div><div><small>Max / Min</small><strong>{selected.maxTemperature}°C / {selected.minTemperature}°C</strong></div><div><small>Humidity</small><strong>{selected.relativeHumidity}%</strong></div><div><small>Wind</small><strong>{selected.windSpeedKmh} km/h</strong></div><div><small>Consecutive hot days</small><strong>{selected.consecutiveHotDays}</strong></div><div><small>Zone baseline</small><strong>{zone?.zone.baselineMaxTemperature ?? '—'}°C</strong></div><div><small>Terrain</small><strong>{zone?.terrainType || '—'}</strong></div><div><small>Vulnerability</small><strong>{formatEnum(zone?.zone.vulnerabilityLevel)}</strong></div></div></div>}
          <div className="generate-note"><CheckCircle2 size={17} /><span>Decision logic runs on Spring Boot, not in the browser. It calculates thermal metrics, applies severity priority rules, and stores a snapshot for auditability.</span></div>
          <button className="button button-primary button-full" disabled={generating || !selected}><FilePlus2 size={16} /> {generating ? 'Evaluating and saving…' : 'Generate & save advisory'}</button>
        </form>}
      </section>
      <aside className="panel engine-info"><div className="engine-info-top"><span className="engine-icon large"><ShieldAlert size={23} /></span><div><span className="eyebrow">MODEL VERSION</span><h3>CES-HW-RULES-v1.0</h3></div></div><p>Transparent decision rules evaluate:</p><ul className="check-list"><li>Temperature departure from baseline</li><li>Terrain-specific thresholds</li><li>Humidity-adjusted apparent temperature</li><li>Warm-night recovery concerns</li><li>Consecutive hot days</li><li>Zone vulnerability and cooling infrastructure</li></ul><div className="engine-priority"><strong>Priority order</strong><span>Review → Severe → Warning → Watch → Normal</span></div><p className="muted small-text">Operational duration and energy-demand outputs are illustrative planning estimates, not certified public-health instructions or utility forecasts.</p><Link to="/model" className="text-link">Read model documentation <ArrowRight size={14} /></Link></aside>
    </div>
    {advisory && <section className="panel generated-result"><div className="generated-result-head"><div><span className="eyebrow">NEW ADVISORY SAVED</span><h2>Decision result</h2><p>Generated {formatDate(advisory.createdAt)} · Observation {formatDate(advisory.observationAt)}</p></div><StatusBadge status={advisory.alertStatus} /></div><p className="result-reasoning">{advisory.reasoning}</p><div className="result-metrics"><ResultMetric label="Heat Index" value={`${advisory.heatIndex ?? '—'}°C`} /><ResultMetric label="Departure" value={`${advisory.temperatureDeparture > 0 ? '+' : ''}${advisory.temperatureDeparture ?? '—'}°C`} /><ResultMetric label="Outdoor restriction" value={advisory.outdoorRestrictionHours == null ? 'Review' : `${advisory.outdoorRestrictionHours} hours`} /><ResultMetric label="Cooling center hours" value={advisory.coolingCenterOperatingHours == null ? 'Review' : `${advisory.coolingCenterOperatingHours} hours`} /></div><div className="sector-grid">{Object.entries(advisory.sectorActions || {}).map(([sector, actions]) => <div className="sector-card" key={sector}><h4>{sector}</h4><ul>{actions.map((action) => <li key={action}>{action}</li>)}</ul></div>)}</div><div className="result-footer"><span>Next evaluation: <strong>{formatDate(advisory.nextEvaluationAt)}</strong></span><Link className="button button-primary" to={`/advisories/${advisory.id}`}>Open full advisory <ArrowRight size={15} /></Link></div></section>}
  </>;
}
function ResultMetric({ label, value }) { return <div><span>{label}</span><strong>{value}</strong></div>; }
