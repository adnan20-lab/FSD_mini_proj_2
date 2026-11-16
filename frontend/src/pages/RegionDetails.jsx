import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Plus, UserRound } from 'lucide-react';
import { api } from '../api';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { EmptyState, ErrorNotice, Loading } from '../components/Feedback';
import { formatEnum, formatDate } from '../utils';

export default function RegionDetails() {
  const { id } = useParams();
  const [region, setRegion] = useState(null);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    Promise.all([api(`/regions/${id}`), api(`/regions/${id}/zones`)]).then(([r, z]) => { setRegion(r); setZones(z); })
      .catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [id]);
  if (loading) return <Loading />;
  if (!region) return <><ErrorNotice message={error || 'Region not found.'} /><Link className="button button-ghost" to="/regions"><ArrowLeft size={16} /> Back to regions</Link></>;
  return <>
    <PageHeader eyebrow="REGION AUTHORITY" title={region.name} description="Authority profile and associated monitoring zones." action={<Link className="button button-primary" to="/zones"><Plus size={16} /> Manage zones</Link>} />
    <ErrorNotice message={error} />
    <div className="detail-grid">
      <section className="panel detail-card"><div className="detail-card-title"><div className="metric-icon blue"><UserRound size={18} /></div><div><h3>Authority profile</h3><p>Registered region information</p></div></div>
        <dl className="detail-list"><div><dt>Nodal officer</dt><dd>{region.nodalOfficer}</dd></div><div><dt>Emergency contact</dt><dd>{region.emergencyContact}</dd></div><div><dt>State / province</dt><dd>{region.state}</dd></div><div><dt>Terrain type</dt><dd>{formatEnum(region.terrainType)}</dd></div><div><dt>Created</dt><dd>{formatDate(region.createdAt)}</dd></div><div><dt>Region ID</dt><dd className="mono-text">{region.id}</dd></div></dl>{region.notes && <div className="notes-box">{region.notes}</div>}
      </section>
      <section className="panel detail-card"><div className="detail-card-title"><div className="metric-icon teal"><MapPin size={18} /></div><div><h3>Monitoring coverage</h3><p>Zones registered under this authority</p></div></div><div className="big-stat"><strong>{zones.length}</strong><span>Monitoring zones</span></div><p className="muted">Terrain classification is used to select the prototype maximum-temperature threshold for all zones associated with this region.</p></section>
    </div>
    <section className="panel table-panel"><div className="panel-heading"><div><h3>Associated monitoring zones</h3><p>Latest available observation and advisory for each zone</p></div></div>
      {!zones.length ? <EmptyState title="No zones under this region" description="Create a monitoring zone and link it to this authority." /> : <div className="table-scroll"><table><thead><tr><th>Zone</th><th>Land use</th><th>Vulnerability</th><th>Baseline max.</th><th>Latest observation</th><th>Latest advisory</th></tr></thead><tbody>{zones.map((item) => <tr key={item.zone.id}><td><Link className="table-primary-link" to={`/zones/${item.zone.id}`}>{item.zone.name}</Link></td><td>{formatEnum(item.zone.landUseType)}</td><td>{formatEnum(item.zone.vulnerabilityLevel)}</td><td>{item.zone.baselineMaxTemperature}°C</td><td>{item.latestObservation ? `${item.latestObservation.maxTemperature}°C · ${formatDate(item.latestObservation.observedAt)}` : '—'}</td><td>{item.latestAdvisory ? <StatusBadge status={item.latestAdvisory.alertStatus} /> : '—'}</td></tr>)}</tbody></table></div>}
    </section>
    <Link className="back-link" to="/regions"><ArrowLeft size={15} /> Back to regions</Link>
  </>;
}
