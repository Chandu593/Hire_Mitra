import React, { Component, createContext, useContext, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, NavLink, Route, Routes, Link, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, BarChart3, BriefcaseBusiness, CheckCircle2, ChevronLeft, ChevronRight, Download, LogOut, Search, Users, Workflow } from 'lucide-react';
import { login as loginApi, me, logout as logoutApi } from './api/auth';
import { jobsApi, applicationsApi, usersApi, dashboardApi, alertsApi } from './api/data';
import './styles.css';

const AuthContext = createContext(null);
const stages = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];
const sources = ['LinkedIn', 'Referral', 'Careers Page', 'Indeed', 'Agency'];

function useAuth() { return useContext(AuthContext); }
function fmt(date) { return date ? new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''; }
function titleize(value) { return value.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()); }
function weekLabel(value) { return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    me()
      .then(u => { if (active) setUser(u); })
      .catch(() => { })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function login(email, password) {
    const loggedIn = await loginApi(email, password);
    setUser(loggedIn);
    return loggedIn;
  }

  function logout() {
    logoutApi();
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

function Protected({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="screen-loader"><div className="spinner" /> Loading workspace...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Page title="Forbidden"><EmptyState title="You do not have access" text="This area is restricted by server-side role permissions." /></Page>;
  }
  return children;
}

function Layout({ children }) {
  const { user, logout } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    if (user?.role === 'recruiter') {
      alertsApi.stalled().then(r => { if (active) setCount(r.count); }).catch(() => { });
    } else {
      setCount(0);
    }
    return () => { active = false; };
  }, [user]);

  return <>
    <aside className="sidebar">
      <Link className="brand" to={user?.role === 'interviewer' ? '/my-applications' : '/dashboard'}>
        <span className="brand-mark"><Workflow size={22} /></span>
        <span>Hire<span>Mitra</span></span>
      </Link>
      {user && <nav className="nav-menu">
        {user.role === 'recruiter' && <>
          <NavItem to="/dashboard" icon={<BarChart3 size={18} />} label="Dashboard" />
          <NavItem to="/jobs" icon={<BriefcaseBusiness size={18} />} label="Jobs" />
          <NavItem to="/applications" icon={<Users size={18} />} label="Applications" />
          <NavItem to="/alerts" icon={<AlertTriangle size={18} />} label="Alerts" badge={count} />
        </>}
        {user.role === 'interviewer' && <NavItem to="/my-applications" icon={<Users size={18} />} label="My Applications" />}
      </nav>}
      {user && <div className="user-panel">
        <div className="avatar">{user.name.slice(0, 1)}</div>
        <div><strong>{user.name}</strong><small>{user.role}</small></div>
        <button className="icon-btn" onClick={logout} title="Logout"><LogOut size={17} /></button>
      </div>}
    </aside>
    <main className="content">{children}</main>
  </>;
}

function NavItem({ to, icon, label, badge }) {
  return <NavLink to={to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
    {icon}<span>{label}</span>{badge !== undefined && <em>{badge}</em>}
  </NavLink>;
}

function BackButton() {
  const navigate = useNavigate();
  return <button className="secondary" type="button" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</button>;
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('Application UI error:', error, info);
  }
  render() {
    if (this.state.error) {
      return <div className="page"><div className="error"><b>Something went wrong in the UI.</b><br />{this.state.error.message}</div><button onClick={() => window.location.reload()}>Reload application</button></div>;
    }
    return this.props.children;
  }
}

function Page({ title, subtitle, children, action }) {
  return <div className="page fade-in">
    <div className="pagehead">
      <div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>
      {action}
    </div>
    {children}
  </div>;
}

function EmptyState({ title, text }) {
  return <div className="empty"><CheckCircle2 size={38} /><h3>{title}</h3><p>{text}</p></div>;
}

function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('recruiter@example.com');
  const [password, setPassword] = useState('Password123!');
  const [err, setErr] = useState('');

  if (user) return <Navigate to={user.role === 'interviewer' ? '/my-applications' : '/dashboard'} replace />;

  async function submit(e) {
    e.preventDefault();
    setErr('');
    try {
      const loggedIn = await login(email, password);
      navigate(loggedIn.role === 'interviewer' ? '/my-applications' : '/dashboard');
    } catch (ex) { setErr(ex.message); }
  }

  return <div className="login-shell">
    <section className="login-hero">
      <div className="brand big"><span className="brand-mark"><Workflow size={28} /></span><span>Hire<span>Mitra</span></span></div>
      <h1>One shared hiring command center.</h1>
      <p>Track openings, candidates, interviewer feedback, stalled alerts and funnel metrics with server-enforced access control.</p>
      <div className="hero-pills"><span>RBAC</span><span>Immutable timeline</span><span>Bulk actions</span></div>
    </section>
    <form onSubmit={submit} className="card login-card">
      <h2>Welcome back</h2>
      <p className="muted">Use demo credentials to review both roles.</p>
      {err && <div className="error">{err}</div>}
      <label>Email<input autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
      <label>Password<input autoComplete="current-password" type="password" value={password} onChange={e => setPassword(e.target.value)} /></label>
      <button className="primary wide">Sign in</button>
      <div className="demo-grid">
        <button type="button" onClick={() => { setEmail('recruiter@example.com'); setPassword('Password123!'); }}>Recruiter demo</button>
        <button type="button" onClick={() => { setEmail('interviewer@example.com'); setPassword('Password123!'); }}>Interviewer demo</button>
      </div>
    </form>
  </div>;
}

function DashboardPage() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    let active = true;
    dashboardApi.get().then(r => { if (active) setData(r); }).catch(e => { if (active) setErr(e.message); });
    return () => { active = false; };
  }, []);

  if (err) return <Page title="Dashboard"><div className="error">{err}</div></Page>;
  if (!data) return <Page title="Dashboard"><div className="skeleton-grid"><div /><div /><div /><div /></div></Page>;

  const max = Math.max(...data.receivedPerWeek.map(x => x.count), 1);
  return <Page title="Dashboard" subtitle="Live snapshot of open roles and candidate movement.">
    <div className="grid4">
      {Object.entries(data.headline).map(([key, value]) => <div className="card stat" key={key}>
        <span>{titleize(key)}</span><strong>{value}</strong><small>Current demo data</small>
      </div>)}
    </div>
    <div className="grid2">
      <section className="card"><h3>Applications by stage</h3>{data.byStage.map(s => <div className="barrow" key={s.stage}><span>{s.stage}</span><b>{s.count}</b></div>)}</section>
      <section className="card"><h3>Applications by job opening</h3>{data.byJobOpening.map(j => <div className="barrow" key={j.jobOpeningId}><span>{j.title}<small>{j.department}</small></span><b>{j.count}</b></div>)}</section>
    </div>
    <section className="card"><h3>Applications received per week</h3><div className="chart-wrap"><div className="chart">{data.receivedPerWeek.map(w => <div className="chartbar" key={w.week} title={`${w.week}: ${w.count}`} style={{ height: `${24 + (w.count / max) * 140}px` }}><span>{w.count}</span><small>{  (w.week)}</small></div>)}</div></div></section>
  </Page>;
}

function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [err, setErr] = useState('');

  function load() {
    setErr('');
    return jobsApi.list(includeArchived).then(setJobs).catch(e => setErr(e.message));
  }

  useEffect(() => {
    let active = true;
    setErr('');
    jobsApi.list(includeArchived).then(r => { if (active) setJobs(r); }).catch(e => { if (active) setErr(e.message); });
    return () => { active = false; };
  }, [includeArchived]);

  async function toggle(job) {
    try {
      job.status === 'open' ? await jobsApi.archive(job._id) : await jobsApi.restore(job._id);
      await load();
    } catch (e) { setErr(e.message); }
  }

  return <Page title="Job Openings" subtitle="Create roles, archive old openings, and keep applications attached." action={<Link className="button primary" to="/jobs/new">New Job</Link>}>
    <label className="switch"><input type="checkbox" checked={includeArchived} onChange={e => setIncludeArchived(e.target.checked)} /><span /> Include archived</label>
    {err && <div className="error">{err}</div>}
    {jobs.length === 0 ? <EmptyState title="No jobs found" text="Create your first job opening to start the pipeline." /> : <JobsTable jobs={jobs} onToggle={toggle} />}
  </Page>;
}

function JobsTable({ jobs, onToggle }) {
  return <div className="table"><table><thead><tr><th>Title</th><th>Department</th><th>Status</th><th>Applications</th><th>Actions</th></tr></thead><tbody>{jobs.map(job => <tr key={job._id}>
    <td><Link className="strong-link" to={`/jobs/${job._id}`}>{job.title}</Link></td><td>{job.department}</td><td><span className={`pill ${job.status}`}>{job.status}</span></td><td>{job.applicationCount}</td>
    <td className="row-actions"><Link to={`/jobs/${job._id}/edit`}>Edit</Link><button onClick={() => onToggle(job)}>{job.status === 'open' ? 'Archive' : 'Restore'}</button></td>
  </tr>)}</tbody></table></div>;
}

function JobFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState({ title: '', department: '', description: '' });
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!isEdit) return undefined;
    let active = true;
    jobsApi.get(id).then(job => { if (active) setForm({ title: job.title, department: job.department, description: job.description }); }).catch(e => { if (active) setErr(e.message); });
    return () => { active = false; };
  }, [id, isEdit]);

  async function submit(e) {
    e.preventDefault();
    try {
      isEdit ? await jobsApi.update(id, form) : await jobsApi.create(form);
      navigate('/jobs');
    } catch (ex) { setErr(ex.message); }
  }

  return <Page title={isEdit ? 'Edit Job' : 'New Job'} action={<BackButton />}>
    <form className="card form" onSubmit={submit}>{err && <div className="error">{err}</div>}
      <label>Title<input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></label>
      <label>Department<input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} /></label>
      <label>Description<textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
      <button className="primary">Save job</button>
    </form>
  </Page>;
}

function JobDetailPage() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [apps, setApps] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [err, setErr] = useState('');
  const [form, setForm] = useState({ candidateName: '', candidateEmail: '', source: 'LinkedIn', notes: '' });

  function load() {
    setErr('');
    return Promise.all([jobsApi.get(id), jobsApi.applications(id)]).then(([j, a]) => { setJob(j); setApps(a); }).catch(e => setErr(e.message));
  }

  useEffect(() => {
    let active = true;
    Promise.all([jobsApi.get(id), jobsApi.applications(id)]).then(([j, a]) => { if (active) { setJob(j); setApps(a); } }).catch(e => { if (active) setErr(e.message); });
    return () => { active = false; };
  }, [id]);

  async function add(e) {
    e.preventDefault();
    try {
      await jobsApi.createApplication(id, form);
      setForm({ candidateName: '', candidateEmail: '', source: 'LinkedIn', notes: '' });
      setShowForm(false);
      await load();
    } catch (ex) { setErr(ex.message); }
  }

  if (!job) return <Page title="Job Opening"><div className="screen-loader"><div className="spinner" /> Loading job...</div></Page>;

  return <Page title={job.title} subtitle={`${job.department} · ${job.status}`} action={<div className="page-actions"><BackButton /><button className="primary" onClick={() => setShowForm(!showForm)}>Add Application</button></div>}>
    {err && <div className="error">{err}</div>}
    {showForm && <form className="card form slide" onSubmit={add}>
      <label>Name<input value={form.candidateName} onChange={e => setForm({ ...form, candidateName: e.target.value })} /></label>
      <label>Email<input autoComplete="email" value={form.candidateEmail} onChange={e => setForm({ ...form, candidateEmail: e.target.value })} /></label>
      <label>Source<select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}>{sources.map(s => <option key={s}>{s}</option>)}</select></label>
      <label>Notes<textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></label>
      <button className="primary">Create application</button>
    </form>}
    <ApplicationsTable apps={apps} />
  </Page>;
}

function ApplicationsTable({ apps, selectable = false, selected = [], setSelected = () => { } }) {
  if (!apps.length) return <EmptyState title="No applications found" text="No candidates match this view yet." />;
  return <div className="table"><table><thead><tr>{selectable && <th></th>}<th>Candidate</th><th>Email</th><th>Job</th><th>Source</th><th>Stage</th><th>Applied</th><th>Updated</th><th>Panel</th></tr></thead><tbody>{apps.map(app => <tr key={app._id}>
    {selectable && <td><input type="checkbox" checked={selected.includes(app._id)} onChange={e => setSelected(e.target.checked ? [...selected, app._id] : selected.filter(id => id !== app._id))} /></td>}
    <td><Link className="strong-link" to={`/applications/${app._id}`}>{app.candidateName}</Link></td><td>{app.candidateEmail}</td><td>{app.jobOpening?.title || ''}</td><td>{app.source}</td><td><span className={`pill stage-${app.stage}`}>{app.stage}</span></td><td>{fmt(app.appliedAt)}</td><td>{fmt(app.updatedAt)}</td><td>{app.assignedInterviewers?.length || 0}</td>
  </tr>)}</tbody></table></div>;
}

function ApplicationsPage() {
  const [params, setParams] = useState({ search: '', jobOpening: '', stage: '', source: '', sortBy: 'updatedAt', sortOrder: 'desc', page: '1', limit: '10' });
  const [data, setData] = useState({ data: [], pagination: {} });
  const [jobs, setJobs] = useState([]);
  const [selected, setSelected] = useState([]);
  const [bulk, setBulk] = useState(null);
  const [err, setErr] = useState('');

  function load(nextParams = params) {
    setErr('');
    return applicationsApi.list(nextParams).then(setData).catch(e => setErr(e.message));
  }

  useEffect(() => {
    let active = true;
    jobsApi.list(true).then(r => { if (active) setJobs(r); }).catch(() => { });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setErr('');
    applicationsApi.list(params).then(r => { if (active) setData(r); }).catch(e => { if (active) setErr(e.message); });
    return () => { active = false; };
  }, [params.page]);

  function updateParam(key, value) { setParams(prev => ({ ...prev, [key]: value })); }
  function search() { const next = { ...params, page: '1' }; setParams(next); load(next); }

  async function runBulk(kind) {
    try {
      const result = kind === 'advance' ? await applicationsApi.bulkAdvance(selected) : await applicationsApi.bulkReject(selected);
      setBulk(result.results);
      setSelected([]);
      await load();
    } catch (e) { setErr(e.message); }
  }

  async function exportCsv() {
    const blob = await applicationsApi.exportCsv();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'HireMitra-snapshot.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return <Page title="Applications" subtitle="Search, filter, sort and act on candidates from one server-backed list." action={<button onClick={exportCsv}><Download size={16} /> Export CSV</button>}>
    <div className="filters card"><input placeholder="Search name/email" value={params.search} onChange={e => updateParam('search', e.target.value)} /><select value={params.jobOpening} onChange={e => updateParam('jobOpening', e.target.value)}><option value="">All jobs</option>{jobs.map(j => <option value={j._id} key={j._id}>{j.title}</option>)}</select><select value={params.stage} onChange={e => updateParam('stage', e.target.value)}><option value="">All stages</option>{stages.map(s => <option key={s}>{s}</option>)}</select><select value={params.source} onChange={e => updateParam('source', e.target.value)}><option value="">All sources</option>{sources.map(s => <option key={s}>{s}</option>)}</select><select value={params.sortBy} onChange={e => updateParam('sortBy', e.target.value)}><option value="updatedAt">Last update</option><option value="appliedAt">Applied date</option><option value="stage">Stage</option></select><button className="primary" onClick={search}><Search size={16} /> Search</button></div>
    {selected.length > 0 && <div className="bulk"><b>{selected.length} selected</b><button onClick={() => runBulk('advance')}>Bulk advance</button><button onClick={() => runBulk('reject')}>Bulk reject</button></div>}
    {err && <div className="error">{err}</div>}
    <ApplicationsTable apps={data.data} selectable selected={selected} setSelected={setSelected} />
    <div className="pager"><span>Total matches: {data.pagination.total || 0}</span><button disabled={params.page === '1'} onClick={() => updateParam('page', String(Number(params.page) - 1))}><ChevronLeft size={16} /> Prev</button><span>Page {data.pagination.page || 1} of {data.pagination.totalPages || 1}</span><button disabled={(data.pagination.page || 1) >= (data.pagination.totalPages || 1)} onClick={() => updateParam('page', String(Number(params.page) + 1))}>Next <ChevronRight size={16} /></button></div>
    {bulk && <section className="card"><h3>Bulk result</h3>{bulk.map((r, i) => <div className={r.status === 'success' ? 'ok' : 'error'} key={i}>{r.candidateName || r.applicationId}: {r.message}</div>)}</section>}
  </Page>;
}

function MyApplicationsPage() {
  const [apps, setApps] = useState([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    let active = true;
    applicationsApi.mine().then(r => { if (active) setApps(r); }).catch(e => { if (active) setErr(e.message); });
    return () => { active = false; };
  }, []);

  return <Page title="My Applications" subtitle="Only applications assigned to you are returned by the server.">{err && <div className="error">{err}</div>}<ApplicationsTable apps={apps} /></Page>;
}

function ApplicationDetailPage() {
  const { applicationId } = useParams();
  const { user } = useAuth();
  const [app, setApp] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [interviewers, setInterviewers] = useState([]);
  const [panel, setPanel] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [err, setErr] = useState('');

  function load() {
    setErr('');
    return Promise.all([applicationsApi.get(applicationId), applicationsApi.timeline(applicationId)])
      .then(([a, t]) => { setApp(a); setPanel(a.assignedInterviewers?.map(i => i._id) || []); setTimeline(t); })
      .catch(e => setErr(e.message));
  }

  useEffect(() => {
    let active = true;
    setErr('');
    Promise.all([applicationsApi.get(applicationId), applicationsApi.timeline(applicationId)])
      .then(([a, t]) => { if (active) { setApp(a); setPanel(a.assignedInterviewers?.map(i => i._id) || []); setTimeline(t); } })
      .catch(e => { if (active) setErr(e.message); });
    if (user?.role === 'recruiter') usersApi.interviewers().then(r => { if (active) setInterviewers(r); }).catch(() => { });
    return () => { active = false; };
  }, [applicationId, user?.role]);

  async function act(fn) { try { await fn(); await load(); } catch (e) { setErr(e.message); } }

  if (!app) return <Page title="Application">{err ? <EmptyState title="Application not available" text={err} /> : <div className="screen-loader"><div className="spinner" /> Loading application...</div>}</Page>;

  return <Page title={app.candidateName} subtitle={`${app.jobOpening?.title || ''} · ${app.candidateEmail}`} action={<BackButton />}>
    <div className="grid2">
      <section className="card profile-card"><span className={`pill stage-${app.stage}`}>{app.stage}</span><p><b>Source:</b> {app.source}</p><p><b>Applied:</b> {fmt(app.appliedAt)}</p><p><b>Notes:</b> {app.notes || '—'}</p>{err && <div className="error">{err}</div>}{user.role === 'recruiter' && <div className="actions"><button onClick={() => act(() => applicationsApi.advance(app._id))}>Advance</button><button onClick={() => act(() => applicationsApi.reject(app._id))}>Reject</button>{app.stage === 'Rejected' && <button onClick={() => act(() => applicationsApi.reinstate(app._id))}>Reinstate</button>}</div>}</section>
      {user.role === 'recruiter' && <section className="card"><h3>Interview panel</h3>{interviewers.map(i => <label className="check" key={i._id}><input type="checkbox" checked={panel.includes(i._id)} onChange={e => setPanel(e.target.checked ? [...panel, i._id] : panel.filter(id => id !== i._id))} /> {i.name} <span className="muted">({i.email})</span></label>)}<button className="primary" onClick={() => act(() => applicationsApi.setInterviewers(app._id, panel))}>Save panel</button></section>}
    </div>
    {user.role === 'interviewer' && <section className="card"><h3>Leave feedback</h3><textarea value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Write feedback for this assigned candidate..." /><button className="primary" onClick={() => act(async () => { await applicationsApi.feedback(app._id, feedback); setFeedback(''); })}>Submit feedback</button></section>}
    <section className="card"><h3>Immutable timeline</h3>{timeline.map(ev => <div className="timeline" key={ev._id}><b>{fmt(ev.createdAt)}</b> — {ev.message} <span className="muted">by {ev.actor?.name}</span>{ev.feedbackText && <blockquote>{ev.feedbackText}</blockquote>}</div>)}</section>
  </Page>;
}

function AlertsPage() {
  const [data, setData] = useState({ alerts: [], count: 0 });
  const [err, setErr] = useState('');

  function load() { return alertsApi.stalled().then(setData).catch(e => setErr(e.message)); }

  useEffect(() => {
    let active = true;
    alertsApi.stalled().then(r => { if (active) setData(r); }).catch(e => { if (active) setErr(e.message); });
    return () => { active = false; };
  }, []);

  async function dismiss(id) { await alertsApi.dismiss(id); await load(); }

  return <Page title="Stalled Alerts" subtitle="Candidates stuck in the same active stage for more than ten days.">
    {err && <div className="error">{err}</div>}
    {data.alerts.length === 0 ? <EmptyState title="No stalled applications" text="Everything is moving right now." /> : <div className="table"><table><thead><tr><th>Candidate</th><th>Job</th><th>Stage</th><th>Days stalled</th><th>Action</th></tr></thead><tbody>{data.alerts.map(a => <tr key={a.application._id}><td><Link className="strong-link" to={`/applications/${a.application._id}`}>{a.application.candidateName}</Link></td><td>{a.application.jobOpening?.title}</td><td><span className={`pill stage-${a.application.stage}`}>{a.application.stage}</span></td><td>{a.daysStalled}</td><td><button onClick={() => dismiss(a.application._id)}>Dismiss</button></td></tr>)}</tbody></table></div>}
  </Page>;
}

function App() {
  return <BrowserRouter><AuthProvider><ErrorBoundary><Layout><Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/dashboard" element={<Protected role="recruiter"><DashboardPage /></Protected>} />
    <Route path="/jobs" element={<Protected role="recruiter"><JobsPage /></Protected>} />
    <Route path="/jobs/new" element={<Protected role="recruiter"><JobFormPage /></Protected>} />
    <Route path="/jobs/:id" element={<Protected role="recruiter"><JobDetailPage /></Protected>} />
    <Route path="/jobs/:id/edit" element={<Protected role="recruiter"><JobFormPage /></Protected>} />
    <Route path="/applications" element={<Protected role="recruiter"><ApplicationsPage /></Protected>} />
    <Route path="/applications/:applicationId" element={<Protected><ApplicationDetailPage /></Protected>} />
    <Route path="/my-applications" element={<Protected role="interviewer"><MyApplicationsPage /></Protected>} />
    <Route path="/alerts" element={<Protected role="recruiter"><AlertsPage /></Protected>} />
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes></Layout></ErrorBoundary></AuthProvider></BrowserRouter>;
}

createRoot(document.getElementById('root')).render(<App />);
