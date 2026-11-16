import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, AlertTriangle, Building2, CheckCircle2, Clock3, Layers3, MapPin, Plus, CloudSun } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api';
import { formatDate, formatEnum, formatStatus } from '../utils';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { EmptyState, ErrorNotice, Loading } from '../components/Feedback';

const statusColors = {
  SEVERE_HEATWAVE_EMERGENCY: '#c43c4e', HEATWAVE_WARNING: '#e47b35',
  HEAT_WATCH_CAUTION: '#d4a62a', NORMAL_CONDITIONS: '#25866b', REVIEW_REQUIRED: '#75838b'
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    api('/dashboard/summary').then(setData).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading label="Loading climate intelligence dashboard…" />;
  return <>
    <PageHeader eyebrow="OVERVIEW · KJS-CES-01" title="Heatwave intelligence dashboard" description="A live view of monitored regions, manual weather observations and explainable civic advisories." action={<Link className="button button-primary" to="/observations"><Plus size={16} /> Record observation</Link>} />
    <ErrorNotice message={error} />
    {data && <>
      <div className="dashboard-intro"><div><span className="intro-label">CURRENT MONITORING SNAPSHOT</span><h2>Climate risk, made actionable.</h2><p>Alert counts reflect the latest saved advisory for each zone. All measurements are manually recorded.</p></div><div className="intro-mark"><CloudMark /></div></div>
      <div className="metric-grid">
        <Metric icon={Building2} label="Registered regions" value={data.totalRegions} note="Municipal / district authorities" color="blue" />
        <Metric icon={MapPin} label="Monitoring zones" value={data.totalZones} note="Configured wards and local areas" color="teal" />
        <Metric icon={AlertTriangle} label="Active heat alerts" value={data.activeHeatwaveZones} note="Warning or severe emergency" color="orange" />
        <Metric icon={Clock3} label="Pending acknowledgements" value={data.pendingAcknowledgements} note="Awaiting civic authority review" color="purple" />
      </div>
      <div className="dashboard-grid">
        <section className="panel chart-panel">
          <div className="panel-heading"><div><h3>Advisories by severity</h3><p>All saved advisories, not just the latest per zone</p></div><Link to="/advisories" className="text-link">View history <ArrowRight size={14} /></Link></div>
          {Object.values(data.severityDistribution || {}).reduce((a, b) => a + b, 0) === 0 ? <EmptyState title="No advisories generated" description="Save an observation, then generate an advisory to populate the severity chart." /> : <div className="chart-wrap"><ResponsiveContainer width="100%" height={260}><BarChart data={Object.entries(data.severityDistribution || {}).map(([status, count]) => ({ status: formatStatus(status), count, fill: statusColors[status] || '#75838b' }))} margin={{ top: 8, right: 12, left: -18, bottom: 6 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9eff0" /><XAxis dataKey="status" tick={{ fontSize: 11, fill: '#718187' }} axisLine={false} tickLine={false} interval={0} /><YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#718187' }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ border: '1px solid #dfe8e9', borderRadius: 10, boxShadow: '0 8px 24px #17393d12' }} /><Bar dataKey="count" radius={[6, 6, 0, 0]}>{Object.entries(data.severityDistribution || {}).map(([status]) => <Cell key={status} fill={statusColors[status] || '#75838b'} />)}</Bar></BarChart></ResponsiveContainer></div>}
        </section>
        <section className="panel activity-panel">
          <div className="panel-heading"><div><h3>Monitoring activity</h3><p>Recent system activity</p></div></div>
          <div className="activity-stat"><span className="activity-icon"><Layers3 size={18} /></span><div><strong>{data.recentAdvisories}</strong><span>Advisories generated in the last 7 days</span></div></div>
          <div className="activity-stat"><span className="activity-icon"><CheckCircle2 size={18} /></span><div><strong>{(data.latestAdvisories || []).filter((a) => a.acknowledgementStatus === 'ACKNOWLEDGED').length}</strong><span>Acknowledged among the latest 6 advisories</span></div></div>
          <div className="quick-links"><Link to="/regions">Manage regions <ArrowRight size={14} /></Link><Link to="/zones">Manage monitoring zones <ArrowRight size={14} /></Link><Link to="/generate">Generate new advisory <ArrowRight size={14} /></Link></div>
        </section>
      </div>
      <section className="panel table-panel">
        <div className="panel-heading"><div><h3>Zone-wise alert status</h3><p>Current status uses each zone’s most recent advisory</p></div><Link to="/zones" className="text-link">All zones <ArrowRight size={14} /></Link></div>
        {!data.zoneOverview?.length ? <EmptyState title="No monitoring zones" description="Start by registering a region, then create monitoring zones under it." /> : <div className="table-scroll"><table><thead><tr><th>Monitoring zone</th><th>Region</th><th>Vulnerability</th><th>Latest max temp.</th><th>Latest advisory</th><th /></tr></thead><tbody>{data.zoneOverview.map((item) => <tr key={item.zone.id}><td><Link className="table-primary-link" to={`/zones/${item.zone.id}`}>{item.zone.name}</Link><small className="cell-sub">{formatEnum(item.zone.landUseType)}</small></td><td>{item.regionName}</td><td>{formatEnum(item.zone.vulnerabilityLevel)}</td><td>{item.latestObservation ? `${item.latestObservation.maxTemperature}°C` : '—'}</td><td>{item.latestAdvisory ? <StatusBadge status={item.latestAdvisory.alertStatus} /> : <span className="muted">No advisory</span>}</td><td><Link className="row-action" to={`/zones/${item.zone.id}`} aria-label="Open zone"><ArrowRight size={16} /></Link></td></tr>)}</tbody></table></div>}
      </section>
      <div className="dashboard-grid lower-grid">
        <section className="panel"><div className="panel-heading"><div><h3>Recent observations</h3><p>Most recently recorded meteorological data</p></div><Link to="/observations" className="text-link">All observations <ArrowRight size={14} /></Link></div>
          {!data.recentObservations?.length ? <EmptyState /> : <div className="compact-list">{data.recentObservations.slice(0, 5).map((o) => <div className="compact-row" key={o.id}><div className="compact-main"><strong>{o.maxTemperature}°C <span>/ {o.minTemperature}°C</span></strong><small>{formatDate(o.observedAt)}</small></div><div className="compact-side"><strong>{o.relativeHumidity}%</strong><small>Humidity</small></div></div>)}</div>}
        </section>
        <section className="panel"><div className="panel-heading"><div><h3>Latest advisories</h3><p>Most recent decisions from the rule engine</p></div><Link to="/advisories" className="text-link">History <ArrowRight size={14} /></Link></div>
          {!data.latestAdvisories?.length ? <EmptyState title="No advisory history" description="Generate the first advisory from a saved observation." /> : <div className="compact-list">{data.latestAdvisories.slice(0, 5).map((a) => <Link className="compact-row compact-link" to={`/advisories/${a.id}`} key={a.id}><div className="compact-main"><strong>{a.zoneNameSnapshot || 'Monitoring zone'}</strong><small>Generated {formatDate(a.createdAt)}</small></div><div className="compact-side"><StatusBadge status={a.alertStatus} /></div></Link>)}</div>}
        </section>
      </div>
      <div className="disclaimer-inline"><AlertTriangle size={16} /><span>This academic prototype uses manually entered measurements and illustrative thresholds. It is not an official warning or a replacement for India Meteorological Department bulletins.</span><Link to="/model">Model details</Link></div>
    </>}
  </>;
}

function Metric({ icon: Icon, label, value, note, color }) {
  return <div className="metric-card"><div className={`metric-icon ${color}`}><Icon size={19} /></div><div className="metric-copy"><span>{label}</span><strong>{value ?? 0}</strong><small>{note}</small></div></div>;
}

function CloudMark() { return <div className="cloud-mark"><span className="sun-orb" /><CloudSun size={70} strokeWidth={1.1} /></div>; }
