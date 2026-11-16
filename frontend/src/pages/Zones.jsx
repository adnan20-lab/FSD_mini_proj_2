import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit2, ExternalLink, Filter, MapPin, Plus, Trash2 } from 'lucide-react';
import { api, jsonBody } from '../api';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { EmptyState, ErrorNotice, Loading, SuccessNotice } from '../components/Feedback';
import { formatEnum } from '../utils';
import { useAuth } from '../auth/AuthContext';

const blank = { name: '', regionId: '', estimatedPopulation: '', areaSqKm: '', landUseType: 'HIGH_DENSITY_URBAN', vulnerabilityLevel: 'MODERATE', baselineMaxTemperature: '35', coolingInfrastructure: 'STANDARD_GRID_ONLY', notes: '' };

export default function Zones() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('ADMIN');
  const [zones, setZones] = useState([]); const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({ regionId: '', landUseType: '', vulnerabilityLevel: '', alertStatus: '' });
  const [modal, setModal] = useState(false); const [editing, setEditing] = useState(null); const [form, setForm] = useState(blank); const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams(Object.entries(filters).filter(([, v]) => v));
      const [z, r] = await Promise.all([api(`/zones${params.toString() ? `?${params}` : ''}`), api('/regions')]);
      setZones(z); setRegions(r);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [filters.regionId, filters.landUseType, filters.vulnerabilityLevel, filters.alertStatus]);

  function change(field, value) { setForm((current) => ({ ...current, [field]: value })); }
  function create() { setEditing(null); setForm({ ...blank, regionId: regions[0]?.id || '' }); setError(''); setModal(true); }
  function edit(item) { setEditing(item.zone); setForm({ name: item.zone.name, regionId: item.zone.regionId, estimatedPopulation: String(item.zone.estimatedPopulation), areaSqKm: String(item.zone.areaSqKm), landUseType: item.zone.landUseType, vulnerabilityLevel: item.zone.vulnerabilityLevel, baselineMaxTemperature: String(item.zone.baselineMaxTemperature), coolingInfrastructure: item.zone.coolingInfrastructure, notes: item.zone.notes || '' }); setError(''); setModal(true); }
  async function save(e) {
    e.preventDefault(); setSaving(true); setError(''); setSuccess('');
    const payload = { ...form, estimatedPopulation: Number(form.estimatedPopulation), areaSqKm: Number(form.areaSqKm), baselineMaxTemperature: Number(form.baselineMaxTemperature) };
    try { await api(editing ? `/zones/${editing.id}` : '/zones', { method: editing ? 'PUT' : 'POST', body: jsonBody(payload) }); setModal(false); setSuccess(editing ? 'Monitoring zone updated.' : 'Monitoring zone created.'); await load(); }
    catch (e2) { setError(e2.message); }
    finally { setSaving(false); }
  }
  async function remove(item) {
    if (!window.confirm(`Delete “${item.zone.name}”? This is blocked while observation or advisory history exists.`)) return;
    setError(''); setSuccess('');
    try { await api(`/zones/${item.zone.id}`, { method: 'DELETE' }); setSuccess('Monitoring zone deleted.'); await load(); }
    catch (e) { setError(e.message); }
  }

  return <>
    <PageHeader eyebrow="MONITORING NETWORK" title="Monitoring zones" description="Configure local wards and heat-vulnerable zones, including population, land use, baseline temperature and cooling infrastructure." action={isAdmin ? <button className="button button-primary" onClick={create} disabled={!regions.length}><Plus size={16} /> Add zone</button> : null} />
    <ErrorNotice message={error} /><SuccessNotice message={success} />
    <section className="panel table-panel">
      <div className="table-toolbar"><div className="toolbar-title"><MapPin size={17} /><strong>Zone registry</strong><span className="count-pill">{zones.length}</span></div><div className="filter-row"><Filter size={16} /><select aria-label="Filter by region" value={filters.regionId} onChange={(e) => setFilters((f) => ({ ...f, regionId: e.target.value }))}><option value="">All regions</option>{regions.map((r) => <option value={r.id} key={r.id}>{r.name}</option>)}</select><select aria-label="Filter by land use" value={filters.landUseType} onChange={(e) => setFilters((f) => ({ ...f, landUseType: e.target.value }))}><option value="">All land-use types</option>{['HIGH_DENSITY_URBAN','INDUSTRIAL_BELT','SEMI_URBAN','RURAL_AGRICULTURAL','GREEN_PERI_URBAN'].map((v) => <option key={v} value={v}>{formatEnum(v)}</option>)}</select><select aria-label="Filter by vulnerability" value={filters.vulnerabilityLevel} onChange={(e) => setFilters((f) => ({ ...f, vulnerabilityLevel: e.target.value }))}><option value="">All vulnerability</option>{['LOW','MODERATE','HIGH','CRITICAL'].map((v) => <option key={v} value={v}>{formatEnum(v)}</option>)}</select><select aria-label="Filter by alert status" value={filters.alertStatus} onChange={(e) => setFilters((f) => ({ ...f, alertStatus: e.target.value }))}><option value="">All alert statuses</option>{['SEVERE_HEATWAVE_EMERGENCY','HEATWAVE_WARNING','HEAT_WATCH_CAUTION','NORMAL_CONDITIONS','REVIEW_REQUIRED'].map((v) => <option key={v} value={v}>{formatEnum(v)}</option>)}</select></div></div>
      {loading ? <Loading /> : !zones.length ? <EmptyState title="No matching monitoring zones" description={regions.length ? 'Create a zone or adjust the active filters.' : 'Create a region first. Monitoring zones must belong to an existing region.'} /> : <div className="table-scroll"><table><thead><tr><th>Zone</th><th>Region</th><th>Land use</th><th>Vulnerability</th><th>Population</th><th>Baseline max.</th><th>Latest alert</th><th>Actions</th></tr></thead><tbody>{zones.map((item) => <tr key={item.zone.id}><td><Link className="table-primary-link" to={`/zones/${item.zone.id}`}>{item.zone.name}</Link><small className="cell-sub">{item.zone.areaSqKm} sq. km</small></td><td>{item.regionName}</td><td>{formatEnum(item.zone.landUseType)}</td><td><span className={`vulnerability-tag vuln-${item.zone.vulnerabilityLevel}`}>{formatEnum(item.zone.vulnerabilityLevel)}</span></td><td>{Number(item.zone.estimatedPopulation).toLocaleString('en-IN')}</td><td>{item.zone.baselineMaxTemperature}°C</td><td>{item.latestAdvisory ? <StatusBadge status={item.latestAdvisory.alertStatus} /> : <span className="muted">No advisory</span>}</td><td><div className="table-actions"><Link className="icon-button" to={`/zones/${item.zone.id}`} title="View details"><ExternalLink size={15} /></Link>{isAdmin && <><button className="icon-button" onClick={() => edit(item)} title="Edit zone"><Edit2 size={15} /></button><button className="icon-button danger" onClick={() => remove(item)} title="Delete zone"><Trash2 size={15} /></button></>}</div></td></tr>)}</tbody></table></div>}
    </section>
    {!isAdmin && <div className="info-strip"><span className="info-strip-icon"><Filter size={17} /></span><div><strong>Read-only access</strong><p>Your account has the OPERATOR role. An administrator manages monitoring-zone records.</p></div></div>}
    <div className="info-strip"><span className="info-strip-icon"><Filter size={17} /></span><div><strong>Baseline temperature is the anomaly reference</strong><p>The rule engine compares each recorded daily maximum with this zone-level historical normal maximum temperature. Editing the baseline does not rewrite already generated advisories; each advisory stores its own input snapshot.</p></div></div>
    {isAdmin && modal && <Modal title={editing ? 'Edit monitoring zone' : 'Create monitoring zone'} onClose={() => setModal(false)} wide><form className="form-grid" onSubmit={save}>
      <Field label="Zone / ward name" required><input value={form.name} onChange={(e) => change('name', e.target.value)} required maxLength={100} /></Field>
      <Field label="Parent region" required><select value={form.regionId} onChange={(e) => change('regionId', e.target.value)} required><option value="">Select region</option>{regions.map((r) => <option key={r.id} value={r.id}>{r.name} · {formatEnum(r.terrainType)}</option>)}</select></Field>
      <Field label="Estimated population" required><input type="number" min="1" step="1" value={form.estimatedPopulation} onChange={(e) => change('estimatedPopulation', e.target.value)} required /></Field>
      <Field label="Area (sq. km)" required><input type="number" min="0.01" step="0.01" value={form.areaSqKm} onChange={(e) => change('areaSqKm', e.target.value)} required /></Field>
      <Field label="Land-use / urban profile" required><select value={form.landUseType} onChange={(e) => change('landUseType', e.target.value)}>{['HIGH_DENSITY_URBAN','INDUSTRIAL_BELT','SEMI_URBAN','RURAL_AGRICULTURAL','GREEN_PERI_URBAN'].map((v) => <option key={v} value={v}>{formatEnum(v)}</option>)}</select></Field>
      <Field label="Vulnerability level" required><select value={form.vulnerabilityLevel} onChange={(e) => change('vulnerabilityLevel', e.target.value)}>{['LOW','MODERATE','HIGH','CRITICAL'].map((v) => <option key={v} value={v}>{formatEnum(v)}</option>)}</select></Field>
      <Field label="Historical normal max. temperature (°C)" required hint="Prototype accepted range: 15°C to 50°C."><input type="number" min="15" max="50" step="0.1" value={form.baselineMaxTemperature} onChange={(e) => change('baselineMaxTemperature', e.target.value)} required /></Field>
      <Field label="Available cooling infrastructure" required><select value={form.coolingInfrastructure} onChange={(e) => change('coolingInfrastructure', e.target.value)}>{['PUBLIC_COOLING_CENTERS','SHADED_TRANSIT_HUBS','MIST_STATIONS','STANDARD_GRID_ONLY'].map((v) => <option key={v} value={v}>{formatEnum(v)}</option>)}</select></Field>
      <Field label="Notes" wide><textarea rows="3" value={form.notes} onChange={(e) => change('notes', e.target.value)} /></Field>
      <div className="form-actions"><button type="button" className="button button-ghost" onClick={() => setModal(false)}>Cancel</button><button className="button button-primary" disabled={saving || !regions.length}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Create zone'}</button></div>
    </form></Modal>}
  </>;
}
function Field({ label, required, hint, wide, children }) { return <label className={`form-field ${wide ? 'span-2' : ''}`}><span>{label}{required && <b className="required"> *</b>}</span>{children}{hint && <small>{hint}</small>}</label>; }
