import neo4j from 'neo4j-driver'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const I = neo4j.int
let s = 42
const rnd = () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
const pick = (arr, n) => { const a = [...arr], out = []; while (out.length < n && a.length) out.push(a.splice(Math.floor(rnd() * a.length), 1)[0]); return out }

const MOVIES = `Inception|2010|English|Sci-Fi,Thriller,Action|Christopher Nolan
The Dark Knight|2008|English|Action,Drama,Thriller|Christopher Nolan
Interstellar|2014|English|Sci-Fi,Drama,Adventure|Christopher Nolan
Spirited Away|2001|Japanese|Animation,Fantasy,Adventure|Hayao Miyazaki
Your Name|2016|Japanese|Animation,Romance,Fantasy|Makoto Shinkai
Weathering With You|2019|Japanese|Animation,Romance,Fantasy|Makoto Shinkai
Princess Mononoke|1997|Japanese|Animation,Fantasy,Adventure|Hayao Miyazaki
Howl's Moving Castle|2004|Japanese|Animation,Fantasy,Romance|Hayao Miyazaki
The Matrix|1999|English|Sci-Fi,Action|Lana Wachowski
Blade Runner 2049|2017|English|Sci-Fi,Drama,Thriller|Denis Villeneuve
Dune|2021|English|Sci-Fi,Adventure,Drama|Denis Villeneuve
Arrival|2016|English|Sci-Fi,Drama|Denis Villeneuve
Pulp Fiction|1994|English|Thriller,Drama,Comedy|Quentin Tarantino
Kill Bill: Vol. 1|2003|English|Action,Thriller|Quentin Tarantino
Django Unchained|2012|English|Action,Drama,Adventure|Quentin Tarantino
Parasite|2019|Korean|Thriller,Drama,Comedy|Bong Joon-ho
Snowpiercer|2013|English|Sci-Fi,Action,Thriller|Bong Joon-ho
Get Out|2017|English|Horror,Thriller|Jordan Peele
Us|2019|English|Horror,Thriller|Jordan Peele
Toy Story|1995|English|Animation,Comedy,Adventure|John Lasseter
Spider-Man: Into the Spider-Verse|2018|English|Animation,Action,Adventure|Bob Persichetti
Mad Max: Fury Road|2015|English|Action,Adventure,Sci-Fi|George Miller
The Grand Budapest Hotel|2014|English|Comedy,Drama|Wes Anderson
Moonrise Kingdom|2012|English|Comedy,Romance,Drama|Wes Anderson
La La Land|2016|English|Romance,Drama,Comedy|Damien Chazelle
Whiplash|2014|English|Drama|Damien Chazelle
The Shining|1980|English|Horror,Thriller|Stanley Kubrick
2001: A Space Odyssey|1968|English|Sci-Fi,Adventure|Stanley Kubrick
Pan's Labyrinth|2006|Spanish|Fantasy,Drama,Horror|Guillermo del Toro
The Shape of Water|2017|English|Fantasy,Romance,Drama|Guillermo del Toro
Avengers: Endgame|2019|English|Action,Sci-Fi,Adventure|Anthony Russo
Everything Everywhere All at Once|2022|English|Sci-Fi,Comedy,Action|Daniel Kwan
Knives Out|2019|English|Thriller,Comedy,Drama|Rian Johnson
Coco|2017|English|Animation,Fantasy,Adventure|Lee Unkrich
Finding Nemo|2003|English|Animation,Adventure,Comedy|Andrew Stanton
Forrest Gump|1994|English|Drama,Romance,Comedy|Robert Zemeckis
Back to the Future|1985|English|Sci-Fi,Comedy,Adventure|Robert Zemeckis
Gladiator|2000|English|Action,Drama,Adventure|Ridley Scott
Alien|1979|English|Sci-Fi,Horror,Thriller|Ridley Scott
Perfect Blue|1997|Japanese|Animation,Thriller,Horror|Satoshi Kon
Akira|1988|Japanese|Animation,Sci-Fi,Action|Katsuhiro Otomo`.split('\n').map(l => l.split('|'))

const FIRST = ['Aarav','Diya','Kabir','Meera','Rohan','Anaya','Vihaan','Isha','Arjun','Naina','Zoya','Dev','Kiara','Reyaan','Tara','Neil','Sana','Ishaan','Myra','Yash','Riya','Veer','Lara','Aryan','Pari','Samar','Anika','Rudra','Ira','Kian']
const LAST = ['Sharma','Khan','Mehta','Iyer','Nair','Reddy','Gupta','Das','Rao','Kapoor','Bose','Menon']
const GENRES = ['Action','Drama','Sci-Fi','Comedy','Thriller','Animation','Romance','Horror','Fantasy','Adventure']

const directors = [...new Set(MOVIES.map(m => m[4]))].map((name, i) => ({ id: 'd' + (i + 1), name }))
const actors = FIRST.map((f, i) => ({ id: 'a' + (i + 1), name: `${f} ${LAST[(i * 5) % LAST.length]}` }))
const users = FIRST.slice(0, 25).map((f, i) => ({ id: 'u' + (i + 1), name: `${f} ${LAST[(i * 7 + 3) % LAST.length]}`, email: i === 0 ? 'demo@movies.com' : `${f.toLowerCase()}${i + 1}@movies.com`, joinDate: `2025-${String(1 + (i % 12)).padStart(2, '0')}-${String(1 + ((i * 3) % 27)).padStart(2, '0')}`, fav: pick(GENRES, 2) }))
const movies = MOVIES.map((m, i) => ({ id: 'm' + (i + 1), title: m[0], year: I(+m[1]), language: m[2], synopsis: `${m[3].split(',').join(' / ')} film directed by ${m[4]}.`, genres: m[3].split(','), director: directors.find(d => d.name === m[4]).id }))

const belongs = movies.flatMap(m => m.genres.map(g => ({ m: m.id, g })))
const directed = movies.map(m => ({ d: m.director, m: m.id }))
const acted = movies.flatMap(m => pick(actors, 3).map((a, k) => ({ a: a.id, m: m.id, role: ['Lead', 'Support', 'Cameo'][k] })))
const rated = users.flatMap(u => pick(movies, 8 + Math.floor(rnd() * 5)).map(m => {
  const inFav = m.genres.some(g => u.fav.includes(g))
  const stars = inFav ? (rnd() < 0.6 ? 5 : 4) : 2 + Math.floor(rnd() * 3)
  return { u: u.id, m: m.id, stars: I(stars), ts: `2025-${String(1 + Math.floor(rnd() * 12)).padStart(2, '0')}-${String(1 + Math.floor(rnd() * 27)).padStart(2, '0')}T10:00:00` }
}))
const pairs = new Set(); users.forEach(u => pick(users.filter(x => x !== u), 2).forEach(f => pairs.add([u.id, f.id].sort().join('|'))))
const friends = [...pairs].map(p => { const [a, b] = p.split('|'); return { a, b, since: 2024 + Math.floor(rnd() * 2) } }).map(f => ({ ...f, since: I(f.since) }))

const driver = neo4j.driver(process.env.NEO4J_URI, neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD))
const session = driver.session()
const run = (q, p = {}) => session.run(q, p)

try {
  console.log('Clearing database...')
  await run('MATCH (n) DETACH DELETE n')
  console.log('Creating constraints and indexes...')
  for (const q of [
    'CREATE CONSTRAINT user_id IF NOT EXISTS FOR (n:User) REQUIRE n.userId IS UNIQUE',
    'CREATE CONSTRAINT user_email IF NOT EXISTS FOR (n:User) REQUIRE n.email IS UNIQUE',
    'CREATE CONSTRAINT movie_id IF NOT EXISTS FOR (n:Movie) REQUIRE n.movieId IS UNIQUE',
    'CREATE CONSTRAINT genre_name IF NOT EXISTS FOR (n:Genre) REQUIRE n.name IS UNIQUE',
    'CREATE CONSTRAINT actor_id IF NOT EXISTS FOR (n:Actor) REQUIRE n.actorId IS UNIQUE',
    'CREATE CONSTRAINT director_id IF NOT EXISTS FOR (n:Director) REQUIRE n.directorId IS UNIQUE',
    'CREATE INDEX movie_title IF NOT EXISTS FOR (m:Movie) ON (m.title)',
    'CREATE INDEX movie_year IF NOT EXISTS FOR (m:Movie) ON (m.year)',
    'CREATE INDEX rated_stars IF NOT EXISTS FOR ()-[r:RATED]-() ON (r.stars)'
  ]) await run(q)

  console.log('Loading nodes...')
  const hash = await bcrypt.hash('password123', 10)
  await run('UNWIND $rows AS r CREATE (:Genre {name:r})', { rows: GENRES })
  await run('UNWIND $rows AS r CREATE (:Director {directorId:r.id, name:r.name})', { rows: directors })
  await run('UNWIND $rows AS r CREATE (:Actor {actorId:r.id, name:r.name})', { rows: actors })
  await run('UNWIND $rows AS r CREATE (:User {userId:r.id, name:r.name, email:r.email, passwordHash:$hash, joinDate:date(r.joinDate)})', { rows: users, hash })
  await run('UNWIND $rows AS r CREATE (:Movie {movieId:r.id, title:r.title, year:r.year, language:r.language, synopsis:r.synopsis})', { rows: movies })

  console.log('Loading relationships...')
  await run('UNWIND $rows AS r MATCH (m:Movie {movieId:r.m}),(g:Genre {name:r.g}) CREATE (m)-[:BELONGS_TO]->(g)', { rows: belongs })
  await run('UNWIND $rows AS r MATCH (d:Director {directorId:r.d}),(m:Movie {movieId:r.m}) CREATE (d)-[:DIRECTED]->(m)', { rows: directed })
  await run('UNWIND $rows AS r MATCH (a:Actor {actorId:r.a}),(m:Movie {movieId:r.m}) CREATE (a)-[:ACTED_IN {role:r.role}]->(m)', { rows: acted })
  await run('UNWIND $rows AS r MATCH (u:User {userId:r.u}),(m:Movie {movieId:r.m}) CREATE (u)-[:RATED {stars:r.stars, timestamp:datetime(r.ts)}]->(m)', { rows: rated })
  await run('UNWIND $rows AS r MATCH (a:User {userId:r.a}),(b:User {userId:r.b}) CREATE (a)-[:FRIENDS_WITH {since:r.since}]->(b)', { rows: friends })
  await run(`MATCH (a:Movie)-[:BELONGS_TO]->(g:Genre)<-[:BELONGS_TO]-(b:Movie) WHERE a.movieId < b.movieId
    WITH a, b, count(g) AS shared
    WITH a, b, shared, COUNT { (a)-[:BELONGS_TO]->() } AS na, COUNT { (b)-[:BELONGS_TO]->() } AS nb
    WITH a, b, round(100.0 * shared / (na + nb - shared)) / 100 AS score WHERE score >= 0.5
    CREATE (a)-[:SIMILAR_TO {score: score}]->(b)`)

  const c = await run('MATCH (n) WITH count(n) AS nodes MATCH ()-[r]->() RETURN nodes, count(r) AS rels')
  console.log(`Done. Nodes: ${c.records[0].get('nodes')}, Relationships: ${c.records[0].get('rels')}`)
  console.log('Demo login -> demo@movies.com / password123 (all seeded users share this password)')
} finally { await session.close(); await driver.close() }
