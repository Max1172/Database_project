import express from 'express'
import cors from 'cors'
import neo4j from 'neo4j-driver'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import 'dotenv/config'

const driver = neo4j.driver(process.env.NEO4J_URI, neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD))
const SECRET = process.env.JWT_SECRET || 'dev-secret'
const I = neo4j.int

const toJS = v => neo4j.isInt(v) ? v.toNumber() : Array.isArray(v) ? v.map(toJS)
  : v && v.constructor === Object ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, toJS(x)])) : v
async function run(q, params = {}, write = false) {
  const s = driver.session({ defaultAccessMode: write ? neo4j.session.WRITE : neo4j.session.READ })
  try { return (await s.run(q, params)).records.map(r => toJS(r.toObject())) } finally { await s.close() }
}
const h = fn => (req, res) => fn(req, res).catch(e => { console.error(e.message); res.status(e.status || 500).json({ error: e.message }) })
const fail = (status, message) => Object.assign(new Error(message), { status })

const app = express()
app.use(cors(), express.json())

// ---------- Auth ----------
app.post('/api/auth/register', h(async (req, res) => {
  const { name, email, password } = req.body
  if (!name || !email || !password || password.length < 6) throw fail(400, 'Name, email and a 6+ character password are required')
  try {
    const [u] = await run(`CREATE (u:User {userId: randomUUID(), name:$name, email:toLower($email), passwordHash:$hash, joinDate:date()})
      RETURN u.userId AS userId, u.name AS name`, { name, email, hash: await bcrypt.hash(password, 10) }, true)
    res.json({ token: jwt.sign({ userId: u.userId }, SECRET, { expiresIn: '8h' }), user: u })
  } catch (e) { throw e.code?.includes('ConstraintValidationFailed') ? fail(409, 'Email already registered') : e }
}))
app.post('/api/auth/login', h(async (req, res) => {
  const [u] = await run('MATCH (u:User {email: toLower($email)}) RETURN u.userId AS userId, u.name AS name, u.passwordHash AS hash', { email: req.body.email || '' })
  if (!u || !(await bcrypt.compare(req.body.password || '', u.hash))) throw fail(401, 'Invalid email or password')
  res.json({ token: jwt.sign({ userId: u.userId }, SECRET, { expiresIn: '8h' }), user: { userId: u.userId, name: u.name } })
}))
app.use('/api', (req, res, next) => {
  try { req.uid = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), SECRET).userId; next() }
  catch { res.status(401).json({ error: 'Please log in' }) }
})

// ---------- Movies: READ ----------
const CARD = `WITH m, [(m)<-[r:RATED]-() | r.stars] AS s
  RETURN m{.movieId, .title, .year, .language, .synopsis,
    genres: [(m)-[:BELONGS_TO]->(g) | g.name],
    director: head([(d)-[:DIRECTED]->(m) | d.name]),
    votes: size(s),
    avgRating: CASE WHEN size(s) = 0 THEN null ELSE round(reduce(t = 0.0, x IN s | t + x) / size(s) * 10) / 10 END} AS movie`
app.get('/api/genres', h(async (_, res) => res.json((await run('MATCH (g:Genre) RETURN g.name AS name ORDER BY name')).map(r => r.name))))
app.get('/api/actors', h(async (_, res) => res.json(await run('MATCH (a:Actor) RETURN a.actorId AS id, a.name AS name ORDER BY name'))))

app.get('/api/movies', h(async (req, res) => {
  const rows = await run(`MATCH (m:Movie)
    WHERE ($q = '' OR toLower(m.title) CONTAINS toLower($q))
      AND ($genre = '' OR EXISTS { (m)-[:BELONGS_TO]->(:Genre {name:$genre}) })
    ${CARD} ORDER BY movie.title LIMIT 100`, { q: req.query.q || '', genre: req.query.genre || '' })
  res.json(rows.map(r => r.movie))
}))
app.get('/api/movies/:id', h(async (req, res) => {
  const [r] = await run(`MATCH (m:Movie {movieId:$id})
    WITH m, [(m)<-[r:RATED]-() | r.stars] AS s
    RETURN m{.movieId, .title, .year, .language, .synopsis,
      genres: [(m)-[:BELONGS_TO]->(g) | g.name],
      director: head([(d)-[:DIRECTED]->(m) | d.name]),
      cast: [(a)-[ar:ACTED_IN]->(m) | {id: a.actorId, name: a.name, role: ar.role}],
      similar: [(m)-[x:SIMILAR_TO]-(o) | {id: o.movieId, title: o.title, score: x.score}][..6],
      votes: size(s),
      avgRating: CASE WHEN size(s) = 0 THEN null ELSE round(reduce(t = 0.0, x IN s | t + x) / size(s) * 10) / 10 END,
      myRating: head([(m)<-[mr:RATED]-(:User {userId:$uid}) | mr.stars])} AS movie`, { id: req.params.id, uid: req.uid })
  if (!r) throw fail(404, 'Movie not found')
  res.json(r.movie)
}))

// ---------- Movies: CREATE / UPDATE / DELETE ----------
const movieBody = b => {
  if (!b.title || !b.year) throw fail(400, 'Title and year are required')
  return { title: b.title.trim(), year: I(parseInt(b.year)), language: b.language || 'English', synopsis: b.synopsis || '',
    genres: (b.genres || []).map(g => g.trim()).filter(Boolean), director: (b.director || '').trim() }
}
app.post('/api/movies', h(async (req, res) => {
  const [r] = await run(`CREATE (m:Movie {movieId: randomUUID(), title:$title, year:$year, language:$language, synopsis:$synopsis})
    WITH m
    FOREACH (gn IN $genres | MERGE (g:Genre {name:gn}) MERGE (m)-[:BELONGS_TO]->(g))
    FOREACH (dn IN CASE WHEN $director <> '' THEN [$director] ELSE [] END |
      MERGE (d:Director {name:dn}) ON CREATE SET d.directorId = randomUUID() MERGE (d)-[:DIRECTED]->(m))
    RETURN m.movieId AS movieId`, movieBody(req.body), true)
  res.status(201).json(r)
}))
app.put('/api/movies/:id', h(async (req, res) => {
  const rows = await run(`MATCH (m:Movie {movieId:$id})
    SET m.title=$title, m.year=$year, m.language=$language, m.synopsis=$synopsis
    WITH m OPTIONAL MATCH (m)-[old:BELONGS_TO]->() DELETE old
    WITH DISTINCT m
    FOREACH (gn IN $genres | MERGE (g:Genre {name:gn}) MERGE (m)-[:BELONGS_TO]->(g))
    RETURN m.movieId AS movieId`, { ...movieBody(req.body), id: req.params.id }, true)
  if (!rows.length) throw fail(404, 'Movie not found')
  res.json(rows[0])
}))
app.delete('/api/movies/:id', h(async (req, res) => {
  await run('MATCH (m:Movie {movieId:$id}) DETACH DELETE m', { id: req.params.id }, true)
  res.json({ deleted: true })
}))

// ---------- Rating (explicit write transaction: 2 statements, atomic) ----------
app.post('/api/movies/:id/rate', h(async (req, res) => {
  const stars = parseInt(req.body.stars)
  if (!(stars >= 1 && stars <= 5)) throw fail(400, 'Stars must be 1-5')
  const session = driver.session()
  try {
    const out = await session.executeWrite(async tx => {
      const a = await tx.run(`MATCH (u:User {userId:$uid}), (m:Movie {movieId:$id})
        MERGE (u)-[r:RATED]->(m) SET r.stars = $stars, r.timestamp = datetime() RETURN count(r) AS n`, { uid: req.uid, id: req.params.id, stars: I(stars) })
      if (a.records[0].get('n').toNumber() === 0) throw fail(404, 'Movie not found')
      const b = await tx.run('MATCH (:Movie {movieId:$id})<-[r:RATED]-() RETURN round(avg(r.stars) * 10) / 10 AS avg, count(r) AS votes', { id: req.params.id })
      return toJS(b.records[0].toObject())
    })
    res.json(out)
  } finally { await session.close() }
}))

// ---------- Recommendations ----------
const REC = 'rec.movieId AS movieId, rec.title AS title, rec.year AS year'
app.get('/api/recommendations/collaborative', h(async (req, res) => res.json(await run(`
  MATCH (me:User {userId:$uid})-[r1:RATED]->(m:Movie)<-[r2:RATED]-(peer:User)
  WHERE r1.stars >= 4 AND r2.stars >= 4 AND peer <> me
  WITH me, peer, count(m) AS overlap ORDER BY overlap DESC LIMIT 10
  MATCH (peer)-[r:RATED]->(rec:Movie) WHERE r.stars >= 4 AND NOT (me)-[:RATED]->(rec)
  RETURN ${REC}, count(DISTINCT peer) AS supporters, round(avg(r.stars) * 10) / 10 AS peerAvg
  ORDER BY supporters DESC, peerAvg DESC LIMIT 10`, { uid: req.uid }))))
app.get('/api/recommendations/content', h(async (req, res) => res.json(await run(`
  MATCH (me:User {userId:$uid})-[r:RATED]->(:Movie)-[:BELONGS_TO]->(g:Genre) WHERE r.stars >= 4
  WITH me, g, count(*) AS w ORDER BY w DESC LIMIT 3
  MATCH (g)<-[:BELONGS_TO]-(rec:Movie) WHERE NOT (me)-[:RATED]->(rec)
  RETURN ${REC}, sum(w) AS score, collect(DISTINCT g.name) AS becauseYouLike
  ORDER BY score DESC LIMIT 10`, { uid: req.uid }))))
app.get('/api/recommendations/friends', h(async (req, res) => res.json(await run(`
  MATCH (me:User {userId:$uid})-[:FRIENDS_WITH]-(f:User)-[r:RATED]->(rec:Movie)
  WHERE r.stars >= 4 AND NOT (me)-[:RATED]->(rec)
  RETURN ${REC}, count(DISTINCT f) AS friendCount, collect(DISTINCT f.name) AS friends
  ORDER BY friendCount DESC LIMIT 10`, { uid: req.uid }))))

// ---------- Analytics ----------
app.get('/api/analytics/top-by-genre', h(async (_, res) => res.json(await run(`
  MATCH (g:Genre)<-[:BELONGS_TO]-(m:Movie)<-[r:RATED]-()
  WITH g, m, avg(r.stars) AS a, count(r) AS c WHERE c >= 2
  ORDER BY a DESC
  WITH g, collect({title: m.title, avg: a})[0] AS top
  RETURN g.name AS genre, top.title AS topMovie, round(top.avg * 100) / 100 AS avgStars ORDER BY genre`))))
app.get('/api/analytics/directors', h(async (_, res) => res.json(await run(`
  MATCH (d:Director)-[:DIRECTED]->(m:Movie)<-[r:RATED]-()
  WITH d, count(DISTINCT m) AS films, count(r) AS ratings, avg(r.stars) AS a WHERE ratings >= 3
  RETURN d.name AS director, films, ratings, round(a * 100) / 100 AS avgStars ORDER BY avgStars DESC LIMIT 10`))))
app.get('/api/analytics/active-users', h(async (_, res) => res.json(await run(`
  MATCH (u:User)-[r:RATED]->() RETURN u.name AS user, count(r) AS ratings, round(avg(r.stars) * 100) / 100 AS avgGiven
  ORDER BY ratings DESC LIMIT 10`))))
app.get('/api/analytics/by-decade', h(async (_, res) => res.json(await run(`
  MATCH (m:Movie) OPTIONAL MATCH (m)<-[r:RATED]-()
  WITH toInteger(m.year / 10) * 10 AS decade, m, avg(r.stars) AS a
  RETURN decade, count(m) AS movies, round(avg(a) * 100) / 100 AS avgStars ORDER BY decade`))))
app.get('/api/analytics/costars', h(async (_, res) => res.json(await run(`
  MATCH (a:Actor)-[:ACTED_IN]->(m:Movie)<-[:ACTED_IN]-(b:Actor) WHERE a.actorId < b.actorId
  RETURN a.name AS actorA, b.name AS actorB, count(m) AS sharedMovies ORDER BY sharedMovies DESC, actorA LIMIT 10`))))
app.get('/api/analytics/similar-users', h(async (req, res) => res.json(await run(`
  MATCH (me:User {userId:$uid})-[:RATED]->(m:Movie)<-[:RATED]-(o:User)
  WITH me, o, count(m) AS common
  WITH o, common, COUNT { (me)-[:RATED]->() } AS a, COUNT { (o)-[:RATED]->() } AS b
  RETURN o.name AS user, common, round(100.0 * common / (a + b - common)) / 100 AS jaccard
  ORDER BY jaccard DESC LIMIT 5`, { uid: req.uid }))))

// Graph algorithm 1: shortest path between two actors (via shared movies)
app.get('/api/analytics/shortest-path', h(async (req, res) => {
  const [r] = await run(`MATCH (a:Actor {actorId:$from}), (b:Actor {actorId:$to})
    MATCH p = shortestPath((a)-[:ACTED_IN*..12]-(b))
    RETURN [n IN nodes(p) | {type: labels(n)[0], name: coalesce(n.name, n.title)}] AS path, length(p) / 2 AS degrees`,
    { from: req.query.from, to: req.query.to })
  res.json(r || { path: [], degrees: null })
}))
// Graph algorithm 2: PageRank over the SIMILAR_TO graph (Neo4j GDS); falls back to weighted degree if GDS isn't installed
app.get('/api/analytics/pagerank', h(async (_, res) => {
  const s = driver.session()
  try {
    await s.run("CALL gds.graph.drop('simGraph', false)")
    await s.run("CALL gds.graph.project('simGraph', 'Movie', {SIMILAR_TO: {orientation: 'UNDIRECTED', properties: 'score'}})")
    const r = await s.run(`CALL gds.pageRank.stream('simGraph', {relationshipWeightProperty: 'score'})
      YIELD nodeId, score RETURN gds.util.asNode(nodeId).title AS title, round(score * 1000) / 1000 AS score ORDER BY score DESC LIMIT 10`)
    await s.run("CALL gds.graph.drop('simGraph', false)")
    res.json({ method: 'PageRank (Neo4j GDS)', rows: r.records.map(x => toJS(x.toObject())) })
  } catch {
    const rows = await run(`MATCH (m:Movie)-[s:SIMILAR_TO]-() RETURN m.title AS title, round(sum(s.score) * 1000) / 1000 AS score ORDER BY score DESC LIMIT 10`)
    res.json({ method: 'Weighted degree centrality (GDS not installed)', rows })
  } finally { await s.close() }
}))

// ---------- Graph visualisation data ----------
const node = (type, id, name) => ({ id: `${type}:${id}`, rawId: id, type, name })
app.get('/api/graph/movie/:id', h(async (req, res) => {
  const [r] = await run(`MATCH (m:Movie {movieId:$id}) RETURN m.title AS title,
    [(m)-[:BELONGS_TO]->(g) | g.name] AS genres,
    [(a)-[:ACTED_IN]->(m) | {id: a.actorId, name: a.name}] AS actors,
    [(d)-[:DIRECTED]->(m) | {id: d.directorId, name: d.name}] AS directors,
    [(m)-[:SIMILAR_TO]-(o) | {id: o.movieId, name: o.title}] AS similar`, { id: req.params.id })
  if (!r) throw fail(404, 'Movie not found')
  const c = node('Movie', req.params.id, r.title), nodes = [c], links = []
  const add = (n, source, target, type) => { nodes.push(n); links.push({ source, target, type }) }
  r.genres.forEach(g => add(node('Genre', g, g), c.id, `Genre:${g}`, 'BELONGS_TO'))
  r.actors.forEach(a => add(node('Actor', a.id, a.name), `Actor:${a.id}`, c.id, 'ACTED_IN'))
  r.directors.forEach(d => add(node('Director', d.id, d.name), `Director:${d.id}`, c.id, 'DIRECTED'))
  r.similar.forEach(m => add(node('Movie', m.id, m.name), c.id, `Movie:${m.id}`, 'SIMILAR_TO'))
  res.json({ nodes, links })
}))
app.get('/api/graph/me', h(async (req, res) => {
  const rows = await run(`MATCH (u:User {userId:$uid}) RETURN u.name AS name,
    [(u)-[r:RATED]->(m) | {id: m.movieId, name: m.title, stars: r.stars}][..15] AS rated,
    [(u)-[:FRIENDS_WITH]-(f) | {id: f.userId, name: f.name}] AS friends`, { uid: req.uid })
  const me = node('User', req.uid, rows[0].name), nodes = [me], links = []
  rows[0].rated.forEach(m => { nodes.push(node('Movie', m.id, m.name)); links.push({ source: me.id, target: `Movie:${m.id}`, type: `RATED ${m.stars}★` }) })
  rows[0].friends.forEach(f => { nodes.push(node('User', f.id, f.name)); links.push({ source: me.id, target: `User:${f.id}`, type: 'FRIENDS_WITH' }) })
  res.json({ nodes, links })
}))

const port = process.env.PORT || 4000
await driver.verifyConnectivity()
app.listen(port, () => console.log(`API on http://localhost:${port}  (connected to Neo4j)`))
