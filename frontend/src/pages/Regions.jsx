import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Edit2, ExternalLink, Plus, Search, Trash2 } from 'lucide-react';
import { api, jsonBody } from '../api';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import { EmptyState, ErrorNotice, Loading, SuccessNotice } from '../components/Feedback';
import { formatEnum } from '../utils';
import { useAuth } from '../auth/AuthContext';

const emptyForm = { name: '', nodalOfficer: '', emergencyContact: '', state: 'Maharashtra', terrainType: 'PLAINS', notes: '' };

export default function Regions() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('ADMIN');
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load(q = query) {
    setLoading(true); setError('');
    try { setRegions(await api(`/regions${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(''); }, []);

  function startCreate() { setEditing(null); setForm(emptyForm); setError(''); setModal(true); }
  function startEdit(region) { setEditing(region); setForm({ name: region.name || '', nodalOfficer: region.nodalOfficer || '', emergencyContact: region.emergencyContact || '', state: region.state || '', terrainType: region.terrainType || 'PLAINS', notes: region.notes || '' }); setError(''); setModal(true); }
  function update(field, value) { setForm((current) => ({ ...current, [field]: value })); }

  async function save(event) {
    event.preventDefault(); setSaving(true); setError(''); setSuccess('');
    try {
      await api(editing ? `/regions/${editing.id}` : '/regions', { method: editing ? 'PUT' : 'POST', body: jsonBody(form) });
      setModal(false); setSuccess(editing ? 'Region details updated.' : 'Region registered successfully.'); await load('');
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function remove(region) {
    if (!window.confirm(`Delete “${region.name}”? This is only possible after all linked monitoring zones have been removed.`)) return;
    setError(''); setSuccess('');
    try { await api(`/regions/${region.id}`, { method: 'DELETE' }); setSuccess('Region deleted.'); await load(); }
    catch (e) { setError(e.message); }
  }

  return <>
    <PageHeader eyebrow="ADMINISTRATION" title="Regions & district authorities" description="Register municipal or district authorities and define the terrain context used by the heatwave decision engine." action={isAdmin ? <button className="button button-primary" onClick={startCreate}><Plus size={16} /> Add region</button> : null} />
    <ErrorNotice message={error} /><SuccessNotice message={success} />
    <section className="panel table-panel">
      <div className="table-toolbar"><div className="toolbar-title"><Building2 size={17} /><strong>Registered regions</strong><span className="count-pill">{regions.length}</span></div><form className="search-box" onSubmit={(e) => { e.preventDefault(); load(query); }}><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search region, state or nodal officer" /><button type="submit">Search</button></form></div>
      {loading ? <Loading /> : regions.length === 0 ? <EmptyState title="No regions found" description="Add the first region or change the search term. A region is required before monitoring zones can be created." /> : <div className="table-scroll"><table><thead><tr><th>Region / authority</th><th>Nodal officer</th><th>Emergency contact</th><th>State</th><th>Terrain type</th><th>Created</th><th>Actions</th></tr></thead><tbody>{regions.map((r) => <tr key={r.id}><td><Link className="table-primary-link" to={`/regions/${r.id}`}>{r.name}</Link><small className="cell-sub">ID · {r.id}</small></td><td>{r.nodalOfficer}</td><td>{r.emergencyContact}</td><td>{r.state}</td><td><span className="soft-tag">{formatEnum(r.terrainType)}</span></td><td>{r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : '—'}</td><td><div className="table-actions"><Link className="icon-button" to={`/regions/${r.id}`} title="View details"><ExternalLink size={15} /></Link>{isAdmin && <><button className="icon-button" onClick={() => startEdit(r)} title="Edit region"><Edit2 size={15} /></button><button className="icon-button danger" onClick={() => remove(r)} title="Delete region"><Trash2 size={15} /></button></>}</div></td></tr>)}</tbody></table></div>}
    </section>
    {!isAdmin && <div className="info-strip"><span className="info-strip-icon"><Building2 size={17} /></span><div><strong>Read-only access</strong><p>Your account has the OPERATOR role. An administrator manages region records.</p></div></div>}
    <div className="info-strip"><span className="info-strip-icon"><Building2 size={17} /></span><div><strong>Region is the parent authority record</strong><p>Each monitoring zone belongs to one region. A region with linked zones cannot be deleted, which prevents accidental loss of monitoring relationships.</p></div></div>
    {isAdmin && modal && <Modal title={editing ? 'Edit region' : 'Register a region'} onClose={() => setModal(false)} wide><form className="form-grid" onSubmit={save}>
      <Field label="Region / district name" required><input value={form.name} onChange={(e) => update('name', e.target.value)} required maxLength={100} placeholder="e.g. Vidarbha Plains Authority" /></Field>
      <Field label="Nodal officer / coordinator" required><input value={form.nodalOfficer} onChange={(e) => update('nodalOfficer', e.target.value)} required maxLength={100} /></Field>
      <Field label="Emergency contact number" required hint="Digits, spaces and + ( ) - are accepted."><input value={form.emergencyContact} onChange={(e) => update('emergencyContact', e.target.value)} required pattern="[+0-9() .-]{7,24}" title="Enter a valid contact number" /></Field>
      <Field label="State / province" required><input value={form.state} onChange={(e) => update('state', e.target.value)} required /></Field>
      <Field label="Climatological terrain" required><select value={form.terrainType} onChange={(e) => update('terrainType', e.target.value)}><option value="PLAINS">Plains</option><option value="COASTAL">Coastal</option><option value="HILLY">Hilly</option></select></Field>
      <Field label="Notes" wide><textarea rows="3" value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="Optional local context" /></Field>
      <div className="form-actions"><button type="button" className="button button-ghost" onClick={() => setModal(false)}>Cancel</button><button disabled={saving} className="button button-primary">{saving ? 'Saving…' : editing ? 'Save changes' : 'Create region'}</button></div>
    </form></Modal>}
  </>;
}

function Field({ label, required, hint, wide, children }) { return <label className={`form-field ${wide ? 'span-2' : ''}`}><span>{label}{required && <b className="required"> *</b>}</span>{children}{hint && <small>{hint}</small>}</label>; }
