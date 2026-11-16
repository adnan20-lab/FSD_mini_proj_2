import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ExternalLink, Filter } from 'lucide-react';
import { api } from '../api';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { EmptyState, ErrorNotice, Loading, SuccessNotice } from '../components/Feedback';
import { formatDate, formatEnum } from '../utils';

export default function Advisories() {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]); const [zones, setZones] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({ zoneId: searchParams.get('zoneId') || '', alertStatus: '', acknowledged: '', from: '', to: '' });
  async function load() {
    setLoading(true); setError('');
    const params = new URLSearchParams();
    for (const key of ['zoneId', 'alertStatus', 'acknowledged']) if (filters[key]) params.set(key, filters[key]);
    if (filters.from) params.set('from', new Date(`${filters.from}T00:00:00`).toISOString());
    if (filters.to) params.set('to', new Date(`${filters.to}T23:59:59.999`).toISOString());
    try { const [a, z] = await Promise.all([api(`/advisories${params.toString() ? `?${params}` : ''}`), api('/zones')]); setItems(a); setZones(z); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [filters.zoneId, filters.alertStatus, filters.acknowledged, filters.from, filters.to]);
  async function acknowledge(id) {
    setError(''); setSuccess('');
    try { await api(`/advisories/${id}/acknowledge`, { method: 'PATCH' }); setSuccess('Advisory marked as acknowledged. The meteorological alert level has not changed.'); await load(); }
    catch (e) { setError(e.message); }
  }
  return <>
    <PageHeader eyebrow="AUDITABLE DECISION HISTORY" title="Alert & advisory history" description="Every engine run is retained as a separate advisory. Acknowledgement is a civic workflow state and does not modify the alert severity." />
    <ErrorNotice message={error} /><SuccessNotice message={success} />
    <section className="panel table-panel"><div className="table-toolbar"><div className="toolbar-title"><AlertTriangle size={17} /><strong>Generated advisories</strong><span className="count-pill">{items.length}</span></div><div className="filter-row"><Filter size={16} /><select value={filters.zoneId} onChange={(e) => setFilters((f) => ({ ...f, zoneId: e.target.value }))}><option value="">All zones</option>{zones.map((z) => <option key={z.zone.id} value={z.zone.id}>{z.zone.name}</option>)}</select><select value={filters.alertStatus} onChange={(e) => setFilters((f) => ({ ...f, alertStatus: e.target.value }))}><option value="">All severity levels</option>{['SEVERE_HEATWAVE_EMERGENCY','HEATWAVE_WARNING','HEAT_WATCH_CAUTION','NORMAL_CONDITIONS','REVIEW_REQUIRED'].map((v) => <option key={v} value={v}>{formatEnum(v)}</option>)}</select><select value={filters.acknowledged} onChange={(e) => setFilters((f) => ({ ...f, acknowledged: e.target.value }))}><option value="">All review states</option><option value="false">Pending acknowledgement</option><option value="true">Acknowledged</option></select><label className="date-filter"><span>From</span><input aria-label="From date" type="date" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} /></label><label className="date-filter"><span>To</span><input aria-label="To date" type="date" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} /></label></div></div>
      {loading ? <Loading /> : !items.length ? <EmptyState title="No advisories match these filters" description="Generate a new advisory from a persisted observation, or adjust the filters." /> : <div className="table-scroll"><table><thead><tr><th>Advisory / zone</th><th>Alert level</th><th>Observation time</th><th>Generated time</th><th>Heat Index</th><th>Review status</th><th>Action</th></tr></thead><tbody>{items.map((a) => <tr key={a.id}><td><Link className="table-primary-link" to={`/advisories/${a.id}`}>{a.zoneNameSnapshot || zones.find((z) => z.zone.id === a.zoneId)?.zone.name || 'Monitoring zone'}</Link><small className="cell-sub">Advisory ID · {a.id.slice(0, 12)}</small></td><td><StatusBadge status={a.alertStatus} /></td><td>{formatDate(a.observationAt)}</td><td>{formatDate(a.createdAt)}</td><td>{a.heatIndex == null ? '—' : `${a.heatIndex}°C`}</td><td>{a.acknowledgementStatus === 'ACKNOWLEDGED' ? <span className="review-state acknowledged"><CheckCircle2 size={14} /> Acknowledged</span> : <span className="review-state pending">Pending review</span>}</td><td><div className="table-actions"><Link className="icon-button" title="Open advisory" to={`/advisories/${a.id}`}><ExternalLink size={15} /></Link>{a.acknowledgementStatus !== 'ACKNOWLEDGED' && <button className="icon-button" title="Acknowledge advisory" onClick={() => acknowledge(a.id)}><CheckCircle2 size={15} /></button>}</div></td></tr>)}</tbody></table></div>}
    </section>
    <div className="info-strip"><span className="info-strip-icon"><CheckCircle2 size={17} /></span><div><strong>Acknowledgement is not the alert level</strong><p>Marking an advisory acknowledged records that an authority reviewed it. The saved severity, inputs, applied rules and explanation remain unchanged.</p></div></div>
  </>;
}
