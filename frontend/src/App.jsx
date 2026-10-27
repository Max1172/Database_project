import { useCallback, useEffect, useRef, useState } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import './styles.css'

const COLORS = { Movie: '#f59f00', User: '#4c6ef5', Genre: '#40c057', Actor: '#be4bdb', Director: '#f06595' }

async function api(path, { method = 'GET', body } = {}) {
  const token = localStorage.getItem('token')
  const r = await fetch('/api' + path, {
    method, body: body ? JSON.stringify(body) : undefined,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw Object.assign(new Error(data.error || 'Request failed'), { status: r.status })
  return data
}

function Graph({ data, onNodeClick, height = 420 }) {
  const box = useRef(); const [w, setW] = useState(700)
  useEffect(() => {
    const f = () => box.current && setW(box.current.clientWidth)
    f(); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f)
  }, [])
  return (
    <div ref={box} className="graph">
      <ForceGraph2D width={w} height={height} graphData={data} backgroundColor="#0f1117"
        linkDirectionalArrowLength={4} linkDirectionalArrowRelPos={1} linkColor={() => '#5c6370'} linkLabel="type"
        nodeLabel={n => `${n.type}: ${n.name}`} onNodeClick={onNodeClick}
        nodeCanvasObject={(n, ctx, k) => {
          ctx.fillStyle = COLORS[n.type] || '#adb5bd'; ctx.beginPath(); ctx.arc(n.x, n.y, 6, 0, 2 * Math.PI); ctx.fill()
          ctx.font = `${11 / k}px sans-serif`; ctx.fillStyle = '#e9ecef'; ctx.textAlign = 'center'; ctx.fillText(n.name, n.x, n.y + 14 / k)
        }} />
      <div className="legend">{Object.entries(COLORS).map(([k, c]) => <span key={k}><i style={{ background: c }} />{k}</span>)}</div>
    </div>
  )
}
const linkKey = l => `${l.source.id ?? l.source}>${l.target.id ?? l.target}>${l.type}`
function mergeGraph(g, add) {
  const ids = new Set(g.nodes.map(n => n.id)), keys = new Set(g.links.map(linkKey))
  return { nodes: [...g.nodes, ...add.nodes.filter(n => !ids.has(n.id))], links: [...g.links, ...add.links.filter(l => !keys.has(linkKey(l)))] }
}

function Table({ rows }) {
  if (!rows?.length) return <p className="mute">No data</p>
  const cols = Object.keys(rows[0])
  return <table><thead><tr>{cols.map(c => <th key={c}>{c}</th>)}</tr></thead>
    <tbody>{rows.map((r, i) => <tr key={i}>{cols.map(c => <td key={c}>{Array.isArray(r[c]) ? r[c].join(', ') : String(r[c] ?? '–')}</td>)}</tr>)}</tbody></table>
}

function Login({ onAuth }) {
  const [mode, setMode] = useState('login'); const [f, setF] = useState({ name: '', email: 'demo@movies.com', password: 'password123' }); const [err, setErr] = useState('')
  const set = k => e => setF({ ...f, [k]: e.target.value })
  const submit = async () => {
    try { const d = await api(`/auth/${mode}`, { method: 'POST', body: f }); localStorage.setItem('token', d.token); localStorage.setItem('user', JSON.stringify(d.user)); onAuth(d.user) }
    catch (e) { setErr(e.message) }
  }
  return (
    <div className="login">
      <h2 style={{ margin: 0 }}>Cine<span style={{ color: '#f59f00' }}>Graph</span></h2>
      <span className="mute">Movie recommendations powered by Neo4j</span>
      {mode === 'register' && <input placeholder="Name" value={f.name} onChange={set('name')} />}
      <input placeholder="Email" value={f.email} onChange={set('email')} />
      <input type="password" placeholder="Password" value={f.password} onChange={set('password')} />
      {err && <span className="err">{err}</span>}
      <button className="on" onClick={submit}>{mode === 'login' ? 'Log in' : 'Create account'}</button>
      <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErr('') }}>{mode === 'login' ? 'New here? Register' : 'Have an account? Log in'}</button>
    </div>
  )
}

function MovieModal({ id, onClose, onChanged, onOpen }) {
  const [m, setM] = useState(null); const [graph, setGraph] = useState({ nodes: [], links: [] })
  const load = useCallback(async (mid) => {
    setM(await api('/movies/' + mid)); setGraph(await api('/graph/movie/' + mid))
  }, [])
  useEffect(() => { load(id) }, [id, load])
  const rate = async s => { await api(`/movies/${id}/rate`, { method: 'POST', body: { stars: s } }); await load(id); onChanged() }
  const expand = async n => { if (n.type === 'Movie') { const add = await api('/graph/movie/' + n.rawId); setGraph(g => mergeGraph(g, add)) } }
  if (!m) return null
  return (
    <div className="modal-bg" onClick={onClose}><div className="modal" onClick={e => e.stopPropagation()}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><h2 style={{ margin: 0 }}>{m.title} <span className="mute">({m.year})</span></h2><button onClick={onClose}>✕</button></div>
      <p className="mute">{m.language} · Directed by {m.director || 'unknown'} · <span className="star">★ {m.avgRating ?? '–'}</span> ({m.votes} ratings)</p>
      <p>{m.synopsis}</p>
      {m.genres.map(g => <span key={g} className="tag">{g}</span>)}
      <p className="rate"><b>Your rating: </b>{[1, 2, 3, 4, 5].map(s => <button key={s} className={m.myRating === s ? 'on' : ''} onClick={() => rate(s)}>{s}★</button>)}</p>
      <p className="mute">Cast: {m.cast.map(c => `${c.name} (${c.role})`).join(', ')}</p>
      <h4 style={{ margin: '14px 0 0' }}>Graph neighbourhood <span className="mute">— click any movie node to expand it</span></h4>
      <Graph data={graph} onNodeClick={expand} height={340} />
      {m.similar.length > 0 && <><b>Similar movies:</b> {m.similar.map(s => <button key={s.id} style={{ margin: 4 }} onClick={() => onOpen(s.id)}>{s.title} · {s.score}</button>)}</>}
    </div></div>
  )
}
function Browse({ openMovie, refreshKey }) {
  const [q, setQ] = useState(''); const [genre, setGenre] = useState(''); const [genres, setGenres] = useState([]); const [rows, setRows] = useState([])
  useEffect(() => { api('/genres').then(setGenres) }, [])
  useEffect(() => { const t = setTimeout(() => api(`/movies?q=${encodeURIComponent(q)}&genre=${encodeURIComponent(genre)}`).then(setRows), 200); return () => clearTimeout(t) }, [q, genre, refreshKey])
  return <>
    <div className="bar"><input placeholder="Search movies…" value={q} onChange={e => setQ(e.target.value)} />
      <select value={genre} onChange={e => setGenre(e.target.value)}><option value="">All genres</option>{genres.map(g => <option key={g}>{g}</option>)}</select></div>
    <div className="grid">{rows.map(m => (
      <div key={m.movieId} className="card" onClick={() => openMovie(m.movieId)}>
        <h3>{m.title}</h3><div className="mute">{m.year} · {m.director}</div>
        <div><span className="star">★ {m.avgRating ?? '–'}</span> <span className="mute">({m.votes})</span></div>
        <div>{m.genres.map(g => <span key={g} className="tag">{g}</span>)}</div>
      </div>))}</div>
  </>
}

function ForYou({ openMovie, refreshKey }) {
  const [kind, setKind] = useState('collaborative'); const [rows, setRows] = useState([])
  const labels = { collaborative: 'People with similar taste', content: 'Based on genres you rate highly', friends: 'Loved by your friends' }
  useEffect(() => { api('/recommendations/' + kind).then(setRows) }, [kind, refreshKey])
  return <>
    <div className="bar">{Object.entries(labels).map(([k, l]) => <button key={k} className={kind === k ? 'on' : ''} onClick={() => setKind(k)}>{l}</button>)}</div>
    {rows.length === 0 && <p className="mute">No recommendations yet — rate a few movies first.</p>}
    <div className="grid">{rows.map(r => (
      <div key={r.movieId} className="card" onClick={() => openMovie(r.movieId)}>
        <h3>{r.title}</h3><div className="mute">{r.year}</div>
        <div className="mute">{r.supporters != null && `${r.supporters} similar users liked it (avg ${r.peerAvg}★)`}
          {r.becauseYouLike && `Because you like ${r.becauseYouLike.join(', ')}`}
          {r.friends && `Friends: ${r.friends.join(', ')}`}</div>
      </div>))}</div>
  </>
}

function Analytics({ refreshKey }) {
  const [d, setD] = useState({}); const [actors, setActors] = useState([]); const [from, setFrom] = useState(''); const [to, setTo] = useState(''); const [path, setPath] = useState(null)
  useEffect(() => {
    const keys = ['top-by-genre', 'directors', 'active-users', 'by-decade', 'costars', 'similar-users', 'pagerank']
    Promise.all(keys.map(k => api('/analytics/' + k))).then(r => setD(Object.fromEntries(keys.map((k, i) => [k, r[i]]))))
  }, [refreshKey])
  useEffect(() => { api('/actors').then(a => { setActors(a); setFrom(a[0]?.id); setTo(a[a.length - 1]?.id) }) }, [])
  const find = async () => setPath(await api(`/analytics/shortest-path?from=${from}&to=${to}`))
  const Box = ({ title, k }) => <section className="box"><h3>{title}</h3><Table rows={d[k]} /></section>
  return <div style={{ display: 'grid', gap: 16 }}>
    <section className="box"><h3>Shortest path between actors (graph algorithm)</h3>
      <div className="bar">
        <select value={from} onChange={e => setFrom(e.target.value)}>{actors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
        <select value={to} onChange={e => setTo(e.target.value)}>{actors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
        <button className="on" onClick={find}>Find path</button></div>
      {path && (path.path.length ? <><span className="mute">{path.degrees} degree(s) of separation</span>
        <div className="path">{path.path.map((n, i) => <span key={i}>{i > 0 && '→ '}<b style={{ borderLeft: `3px solid ${COLORS[n.type]}` }}>{n.name}</b></span>)}</div></> : <p className="mute">No connection found.</p>)}
    </section>
    <section className="box"><h3>Most central movies — {d.pagerank?.method}</h3><Table rows={d.pagerank?.rows} /></section>
    <div className="two">
      <Box title="Top-rated movie per genre" k="top-by-genre" /><Box title="Director leaderboard" k="directors" />
      <Box title="Most active reviewers" k="active-users" /><Box title="Taste-twins (Jaccard similarity)" k="similar-users" />
      <Box title="Ratings by decade" k="by-decade" /><Box title="Frequent co-stars" k="costars" />
    </div>
  </div>
}

function Explorer() {
  const [g, setG] = useState({ nodes: [], links: [] })
  useEffect(() => { api('/graph/me').then(setG) }, [])
  const expand = async n => { if (n.type === 'Movie') { const add = await api('/graph/movie/' + n.rawId); setG(cur => mergeGraph(cur, add)) } }
  return <><p className="mute">Your taste graph: you → movies you rated → friends. Click a movie node to expand its genres, cast, director and similar films.</p><Graph data={g} onNodeClick={expand} height={540} /></>
}

function Manage({ refreshKey, onChanged }) {
  const empty = { title: '', year: '', language: 'English', genres: '', director: '', synopsis: '' }
  const [rows, setRows] = useState([]); const [f, setF] = useState(empty); const [editing, setEditing] = useState(null); const [msg, setMsg] = useState('')
  const reload = () => api('/movies').then(setRows)
  useEffect(() => { reload() }, [refreshKey])
  const set = k => e => setF({ ...f, [k]: e.target.value })
  const save = async () => {
    try {
      const body = { ...f, genres: f.genres.split(',') }
      editing ? await api('/movies/' + editing, { method: 'PUT', body }) : await api('/movies', { method: 'POST', body })
      setMsg(editing ? 'Movie updated' : 'Movie created'); setF(empty); setEditing(null); onChanged()
    } catch (e) { setMsg(e.message) }
  }
  const edit = m => { setEditing(m.movieId); setF({ title: m.title, year: m.year, language: m.language, genres: m.genres.join(', '), director: m.director || '', synopsis: m.synopsis }); window.scrollTo(0, 0) }
  const del = async m => { if (confirm(`Delete "${m.title}" and all its relationships?`)) { await api('/movies/' + m.movieId, { method: 'DELETE' }); onChanged() } }
  return <>
    <section className="box"><h3>{editing ? 'Edit movie' : 'Add a movie'}</h3>
      <div className="form">
        <input placeholder="Title" value={f.title} onChange={set('title')} /><input placeholder="Year" type="number" value={f.year} onChange={set('year')} />
        <input placeholder="Language" value={f.language} onChange={set('language')} /><input placeholder="Director" value={f.director} onChange={set('director')} />
        <input className="full" placeholder="Genres (comma separated)" value={f.genres} onChange={set('genres')} />
        <textarea className="full" placeholder="Synopsis" rows={2} value={f.synopsis} onChange={set('synopsis')} />
        <div className="full"><button className="on" onClick={save}>{editing ? 'Update' : 'Create'}</button> {editing && <button onClick={() => { setEditing(null); setF(empty) }}>Cancel</button>} <span className="mute"> {msg}</span></div>
      </div></section>
    <br /><section className="box"><h3>All movies ({rows.length})</h3>
      <table><tbody>{rows.map(m => <tr key={m.movieId}><td>{m.title} <span className="mute">({m.year})</span></td><td style={{ textAlign: 'right' }}><button onClick={() => edit(m)}>Edit</button> <button className="danger" onClick={() => del(m)}>Delete</button></td></tr>)}</tbody></table></section>
  </>
}

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'))
  const [tab, setTab] = useState('Browse'); const [open, setOpen] = useState(null); const [rk, setRk] = useState(0)
  const bump = () => setRk(k => k + 1)
  const logout = () => { localStorage.clear(); setUser(null) }
  useEffect(() => { 
    const h = e => e.reason?.status === 401 && logout(); window.addEventListener('unhandledrejection', h); return () => window.removeEventListener('unhandledrejection', h)
  }, [])
  if (!user) return <Login onAuth={setUser} />
  const tabs = { Browse: <Browse openMovie={setOpen} refreshKey={rk} />, 'For You': <ForYou openMovie={setOpen} refreshKey={rk} />, Analytics: <Analytics refreshKey={rk} />, 'Graph Explorer': <Explorer key={rk} />, Manage: <Manage refreshKey={rk} onChanged={bump} /> }
  return <>
    <header><h1>Cine<span>Graph</span></h1>
      <nav>{Object.keys(tabs).map(t => <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t}</button>)}</nav>
      <div><span className="mute">{user.name} </span><button onClick={logout}>Log out</button></div></header>
    <main>{tabs[tab]}</main>
    {open && <MovieModal id={open} onClose={() => setOpen(null)} onChanged={bump} onOpen={setOpen} />}
  </>
}
