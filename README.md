# CineGraph – Movie Recommendation System (Neo4j)
BCSE302P Database Systems Lab project. React + Express + Neo4j 5.

## 1. Get a Neo4j 5 database (pick one)
- **Neo4j Desktop** – create a local DBMS (5.x), start it, note the password.
- **Neo4j Aura Free** – create an instance, download the credentials file (URI looks like `neo4j+s://xxxx.databases.neo4j.io`).
- **Docker** – `docker run -p7474:7474 -p7687:7687 -e NEO4J_AUTH=neo4j/password123 neo4j:5`

## 2. Backend
```bash
cd backend
cp .env.example .env      # fill in NEO4J_URI / NEO4J_USER / NEO4J_PASSWORD
npm install
npm run seed              # wipes DB, loads 128 nodes + ~500 relationships, constraints, indexes
npm start                 # API on http://localhost:4000
```
Demo login: `demo@movies.com` / `password123` (every seeded user has this password).

## 3. Frontend
```bash
cd frontend
npm install
npm run dev               # http://localhost:5173 (proxies /api to :4000)
```

## Rubric mapping
| Requirement | Where |
|---|---|
| 5 node labels | User, Movie, Genre, Actor, Director |
| 6 relationship types | RATED, BELONGS_TO, ACTED_IN, DIRECTED, SIMILAR_TO, FRIENDS_WITH |
| 100+ nodes | seed.js → 128 nodes |
| Constraints + indexes | seed.js (6 uniqueness constraints; indexes on title, year, RATED.stars) |
| Node/relationship CRUD | `server.js` → movies POST/PUT/DELETE, rating MERGE, users register |
| Transaction | `POST /api/movies/:id/rate` (explicit `executeWrite`, 2 statements) |
| Basic authentication | bcrypt + JWT (`/api/auth/*`, middleware) |
| 10+ Cypher queries | movie list (search/filter), movie detail, collaborative rec, content rec, friends rec, top-by-genre, director leaderboard, active users, ratings by decade, co-stars, taste-twins (Jaccard), shortest path, PageRank, graph neighbourhood, taste graph |
| 2 graph algorithms | **Shortest path** (`shortestPath`) and **PageRank** (GDS; auto-falls back to weighted degree if GDS plugin isn't installed) |
| Similarity recommendations | `SIMILAR_TO` (Jaccard on genres, computed in seed) + collaborative filtering |
| Interactive graph visualization | Movie modal + Graph Explorer (click a movie node to expand) |
| Responsive UI | CSS grid / flex, tested down to phone width |

## Live-demo script (Review 3)
1. Log in → Browse: search "space", filter by Sci-Fi.
2. Open a movie → rate it → watch graph + average update.
3. For You → all three recommendation modes; rate more movies and show the list change.
4. Analytics → shortest path between two actors, PageRank table, aggregations.
5. Graph Explorer → expand movie nodes live.
6. Manage → create, edit, delete a movie (CRUD).
7. In Neo4j Browser run `CALL db.schema.visualization()` and `SHOW INDEXES` to show schema/indexes.

## Notes
- Requires Neo4j **5.x** (uses `COUNT { }` subqueries and `elementId`-era syntax).
- PageRank needs the Graph Data Science plugin (available in Desktop; not on Aura Free). Without it, the app uses the fallback and labels it.
- Never commit `.env`.
