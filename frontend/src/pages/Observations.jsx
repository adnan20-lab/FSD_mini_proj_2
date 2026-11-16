import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CloudSun, Edit2, FilePlus2, Save, Trash2 } from 'lucide-react';
import { api, jsonBody } from '../api';
import PageHeader from '../components/PageHeader';
import { EmptyState, ErrorNotice, Loading, SuccessNotice } from '../components/Feedback';
import { asIso, formatDate, toLocalDateTimeInput } from '../utils';

const blank = () => ({ zoneId: '', observedAt: toLocalDateTimeInput(), maxTemperature: '', minTemperature: '', relativeHumidity: '', windSpeedKmh: '0', consecutiveHotDays: '0', uvIndex: '', solarRadiationNotes: '', fieldNotes: '' });

export default function Observations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryZoneId = searchParams.get('zoneId') || '';
  const [zones, setZones] = useState([]); const [selectedZoneId, setSelectedZoneId] = useState(queryZoneId); const [zoneInfo, setZoneInfo] = useState(null);
  const [observations, setObservations] = useState([]); const [form, setForm] = useState(blank()); const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState('');

  async function loadZones() {
    try { const list = await api('/zones'); setZones(list); if (!selectedZoneId && !queryZoneId && list.length) setSelectedZoneId(list[0].zone.id); }
    catch (e) { setError(e.message); }
  }
  async function loadHistory(zoneId = selectedZoneId) {
    setLoading(true); setError('');
    try { setObservations(await api(`/observations${zoneId ? `?zoneId=${encodeURIComponent(zoneId)}` : ''}`)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadZones(); }, []);
  useEffect(() => {
    setForm((current) => ({ ...current, zoneId: selectedZoneId }));
    if (selectedZoneId) api(`/zones/${selectedZoneId}`).then(setZoneInfo).catch(() => setZoneInfo(null)); else setZoneInfo(null);
    loadHistory(selectedZoneId);
  }, [selectedZoneId]);
  useEffect(() => { if (queryZoneId && queryZoneId !== selectedZoneId) setSelectedZoneId(queryZoneId); }, [queryZoneId]);

  function update(field, value) { setForm((current) => ({ ...current, [field]: value })); }
  function startEdit(obs) {
    setEditing(obs.id); setSelectedZoneId(obs.zoneId);
    setForm({ zoneId: obs.zoneId, observedAt: toLocalDateTimeInput(obs.observedAt), maxTemperature: String(obs.maxTemperature), minTemperature: String(obs.minTemperature), relativeHumidity: String(obs.relativeHumidity), windSpeedKmh: String(obs.windSpeedKmh), consecutiveHotDays: String(obs.consecutiveHotDays), uvIndex: obs.uvIndex == null ? '' : String(obs.uvIndex), solarRadiationNotes: obs.solarRadiationNotes || '', fieldNotes: obs.fieldNotes || '' });
    setError(''); setSuccess(''); window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function resetForm() { setEditing(null); setForm({ ...blank(), zoneId: selectedZoneId }); }
  async function submit(e) {
    e.preventDefault(); setError(''); setSuccess('');
    if (!form.zoneId) { setError('Select a monitoring zone before recording an observation.'); return; }
    if (Number(form.minTemperature) > Number(form.maxTemperature)) { setError('Minimum (nighttime) temperature must be less than or equal to maximum temperature.'); return; }
    if (new Date(form.observedAt).getTime() > Date.now() + 60000) { setError('Observation date and time cannot be in the future.'); return; }
    setSaving(true);
    const payload = { zoneId: form.zoneId, observedAt: asIso(form.observedAt), maxTemperature: Number(form.maxTemperature), minTemperature: Number(form.minTemperature), relativeHumidity: Number(form.relativeHumidity), windSpeedKmh: Number(form.windSpeedKmh), consecutiveHotDays: Number(form.consecutiveHotDays), uvIndex: form.uvIndex === '' ? null : Number(form.uvIndex), solarRadiationNotes: form.solarRadiationNotes || null, fieldNotes: form.fieldNotes || null };
    try { const saved = await api(editing ? `/observations/${editing}` : '/observations', { method: editing ? 'PUT' : 'POST', body: jsonBody(payload) }); setSuccess(editing ? 'Observation updated. Existing advisory snapshots remain unchanged.' : 'Observation saved in MongoDB. You can now generate an advisory from this saved record.'); resetForm(); setSelectedZoneId(saved.zoneId); await loadHistory(saved.zoneId); }
    catch (e2) { setError(e2.message); }
    finally { setSaving(false); }
  }
  async function remove(obs) {
    if (!window.confirm('Delete this observation? An observation with a generated advisory cannot be deleted.')) return;
    setError(''); setSuccess('');
    try { await api(`/observations/${obs.id}`, { method: 'DELETE' }); setSuccess('Observation deleted.'); await loadHistory(); }
    catch (e) { setError(e.message); }
  }

  const zone = zoneInfo?.zone;
  return <>
    <PageHeader eyebrow="MANUAL DATA CAPTURE" title="Record meteorological observation" description="Enter a field observation for a monitoring zone. This form does not use live satellite, IoT or third-party weather feeds." />
    <ErrorNotice message={error} /><SuccessNotice message={success} />
    <div className="observation-layout">
      <section className="panel observation-form-panel">
        <div className="panel-heading"><div><h3>{editing ? 'Edit saved observation' : 'New manual observation'}</h3><p><span className="manual-tag"><CloudSun size={13} /> MANUAL ENTRY</span> · Save first, generate an advisory second.</p></div></div>
        <form onSubmit={submit} className="form-grid">
          <Field label="Monitoring zone" required wide><select value={form.zoneId || selectedZoneId} onChange={(e) => { setSelectedZoneId(e.target.value); update('zoneId', e.target.value); setSearchParams(e.target.value ? { zoneId: e.target.value } : {}); }} required><option value="">Select a zone</option>{zones.map((item) => <option key={item.zone.id} value={item.zone.id}>{item.zone.name} · {item.regionName}</option>)}</select></Field>
          {zone && <div className="zone-context span-2"><div><span>Region / terrain</span><strong>{zoneInfo.regionName} · {zoneInfo.terrainType}</strong></div><div><span>Vulnerability</span><strong>{zone.vulnerabilityLevel}</strong></div><div><span>Historical baseline</span><strong>{zone.baselineMaxTemperature}°C</strong></div></div>}
          <Field label="Observation date & time" required wide hint="Local date/time of the measurement — not the time the advisory is generated."><input type="datetime-local" value={form.observedAt} onChange={(e) => update('observedAt', e.target.value)} required /></Field>
          <div className="form-section-label span-2">TEMPERATURE MEASUREMENTS</div>
          <Field label="Daytime maximum temperature (°C)" required><input type="number" min="-10" max="60" step="0.1" value={form.maxTemperature} onChange={(e) => update('maxTemperature', e.target.value)} required placeholder="e.g. 42.5" /></Field>
          <Field label="Nighttime minimum temperature (°C)" required><input type="number" min="-15" max="60" step="0.1" value={form.minTemperature} onChange={(e) => update('minTemperature', e.target.value)} required placeholder="e.g. 28.0" /></Field>
          <div className="form-section-label span-2">ATMOSPHERIC CONDITIONS</div>
          <Field label="Relative humidity (%)" required><input type="number" min="0" max="100" step="0.1" value={form.relativeHumidity} onChange={(e) => update('relativeHumidity', e.target.value)} required /></Field>
          <Field label="Wind speed (km/h)" required><input type="number" min="0" max="200" step="0.1" value={form.windSpeedKmh} onChange={(e) => update('windSpeedKmh', e.target.value)} required /></Field>
          <Field label="Consecutive hot days" required><input type="number" min="0" max="90" step="1" value={form.consecutiveHotDays} onChange={(e) => update('consecutiveHotDays', e.target.value)} required /></Field>
          <Field label="UV index (0–15)"><input type="number" min="0" max="15" step="0.1" value={form.uvIndex} onChange={(e) => update('uvIndex', e.target.value)} /></Field>
          <Field label="Solar radiation notes"><input value={form.solarRadiationNotes} onChange={(e) => update('solarRadiationNotes', e.target.value)} placeholder="Optional field notes" /></Field>
          <Field label="Observation / field notes" wide><textarea rows="3" value={form.fieldNotes} onChange={(e) => update('fieldNotes', e.target.value)} placeholder="Enter source, location context or verification notes…" /></Field>
          <div className="form-actions span-2"><button type="button" className="button button-ghost" onClick={resetForm}>Clear form</button><button className="button button-primary" disabled={saving || !zones.length}><Save size={15} /> {saving ? 'Saving…' : editing ? 'Update observation' : 'Save observation'}</button></div>
        </form>
      </section>
      <aside className="observation-aside">
        <div className="panel context-panel"><div className="aside-icon"><CloudSun size={20} /></div><h3>Why this data matters</h3><p>The portal compares the recorded maximum temperature with the zone’s historical baseline, estimates apparent temperature, and considers humidity, warm nights, terrain and vulnerability.</p><div className="context-rule"><strong>Important sequence</strong><ol><li>Record the observation.</li><li>Save it to the database.</li><li>Generate an advisory from its saved ID.</li></ol></div></div>
        <div className="panel context-panel"><h3>Input validation</h3><ul className="check-list"><li>Maximum temperature: −10°C to 60°C</li><li>Minimum must not exceed maximum</li><li>Relative humidity: 0–100%</li><li>Wind speed: 0–200 km/h</li><li>Consecutive hot days: 0–90</li><li>Observation time cannot be in the future</li></ul></div>
      </aside>
    </div>
    <section className="panel table-panel history-panel"><div className="panel-heading"><div><h3>Observation history</h3><p>{selectedZoneId ? 'Chronological records for the selected zone' : 'All saved manual weather observations'}</p></div><div className="history-filter"><select value={selectedZoneId} onChange={(e) => { setSelectedZoneId(e.target.value); setSearchParams(e.target.value ? { zoneId: e.target.value } : {}); }}><option value="">All zones</option>{zones.map((z) => <option key={z.zone.id} value={z.zone.id}>{z.zone.name}</option>)}</select></div></div>
      {loading ? <Loading /> : !observations.length ? <EmptyState title="No observations recorded" description="Select a monitoring zone and save the first manually recorded observation." /> : <div className="table-scroll"><table><thead><tr><th>Observation time</th><th>Zone ID</th><th>Max / min temp.</th><th>Humidity</th><th>Wind</th><th>Hot days</th><th>Created</th><th>Actions</th></tr></thead><tbody>{observations.map((o) => <tr key={o.id}><td>{formatDate(o.observedAt)}</td><td><Link to={`/zones/${o.zoneId}`} className="table-primary-link">{zones.find((z) => z.zone.id === o.zoneId)?.zone.name || o.zoneId.slice(0, 9)}</Link></td><td><strong>{o.maxTemperature}°C</strong> / {o.minTemperature}°C</td><td>{o.relativeHumidity}%</td><td>{o.windSpeedKmh} km/h</td><td>{o.consecutiveHotDays}</td><td>{formatDate(o.createdAt)}</td><td><div className="table-actions"><Link to={`/generate?observationId=${o.id}`} className="icon-button" title="Generate advisory"><FilePlus2 size={15} /></Link><button className="icon-button" title="Edit observation" onClick={() => startEdit(o)}><Edit2 size={15} /></button><button className="icon-button danger" title="Delete observation" onClick={() => remove(o)}><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div>}
    </section>
  </>;
}
function Field({ label, required, hint, wide, children }) { return <label className={`form-field ${wide ? 'span-2' : ''}`}><span>{label}{required && <b className="required"> *</b>}</span>{children}{hint && <small>{hint}</small>}</label>; }
