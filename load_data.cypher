CREATE CONSTRAINT user_id_unique     IF NOT EXISTS FOR (u:User)     REQUIRE u.userId IS UNIQUE;
CREATE CONSTRAINT movie_id_unique    IF NOT EXISTS FOR (m:Movie)    REQUIRE m.movieId IS UNIQUE;
CREATE CONSTRAINT genre_id_unique    IF NOT EXISTS FOR (g:Genre)    REQUIRE g.name IS UNIQUE;
CREATE CONSTRAINT actor_id_unique    IF NOT EXISTS FOR (a:Actor)    REQUIRE a.actorId IS UNIQUE;
CREATE CONSTRAINT director_id_unique IF NOT EXISTS FOR (d:Director) REQUIRE d.directorId IS UNIQUE;
UNWIND [
  {name: 'Action'},
  {name: 'Drama'},
  {name: 'Sci-Fi'},
  {name: 'Comedy'},
  {name: 'Thriller'},
  {name: 'Romance'},
  {name: 'Adventure'},
  {name: 'Fantasy'}
] AS row
CREATE (:Genre {name: row.name});
UNWIND [
  {userId: 101, name: 'Riya Sharma', age: 24, email: 'riya.sharma@example.com'},
  {userId: 102, name: 'Aman Gupta', age: 27, email: 'aman.gupta@example.com'},
  {userId: 103, name: 'Neha Verma', age: 22, email: 'neha.verma@example.com'},
  {userId: 104, name: 'Karan Mehta', age: 29, email: 'karan.mehta@example.com'},
  {userId: 105, name: 'Priya Nair', age: 25, email: 'priya.nair@example.com'},
  {userId: 106, name: 'Rohit Singh', age: 31, email: 'rohit.singh@example.com'},
  {userId: 107, name: 'Ananya Iyer', age: 23, email: 'ananya.iyer@example.com'},
  {userId: 108, name: 'Vikram Rao', age: 28, email: 'vikram.rao@example.com'},
  {userId: 109, name: 'Sneha Joshi', age: 26, email: 'sneha.joshi@example.com'},
  {userId: 110, name: 'Arjun Kapoor', age: 30, email: 'arjun.kapoor@example.com'},
  {userId: 111, name: 'Divya Menon', age: 24, email: 'divya.menon@example.com'},
  {userId: 112, name: 'Kabir Malhotra', age: 27, email: 'kabir.malhotra@example.com'},
  {userId: 113, name: 'Ishita Kulkarni', age: 22, email: 'ishita.kulkarni@example.com'},
  {userId: 114, name: 'Aditya Pillai', age: 29, email: 'aditya.pillai@example.com'},
  {userId: 115, name: 'Meera Reddy', age: 25, email: 'meera.reddy@example.com'}
] AS row
CREATE (:User {userId: row.userId, name: row.name, age: row.age, email: row.email});
UNWIND [
  {movieId: 201, title: 'Inception', year: 2010, duration: 148, rating: 8.8},
  {movieId: 202, title: 'The Shawshank Redemption', year: 1994, duration: 142, rating: 9.3},
  {movieId: 203, title: 'Interstellar', year: 2014, duration: 169, rating: 8.7},
  {movieId: 204, title: 'The Dark Knight', year: 2008, duration: 152, rating: 9},
  {movieId: 205, title: 'Parasite', year: 2019, duration: 132, rating: 8.5},
  {movieId: 206, title: 'Forrest Gump', year: 1994, duration: 142, rating: 8.8},
  {movieId: 207, title: 'The Matrix', year: 1999, duration: 136, rating: 8.7},
  {movieId: 208, title: 'Gladiator', year: 2000, duration: 155, rating: 8.5},
  {movieId: 209, title: 'Whiplash', year: 2014, duration: 106, rating: 8.5},
  {movieId: 210, title: 'Edge of Tomorrow', year: 2014, duration: 113, rating: 7.9},
  {movieId: 211, title: 'La La Land', year: 2016, duration: 128, rating: 8},
  {movieId: 212, title: 'The Grand Budapest Hotel', year: 2014, duration: 99, rating: 8.1},
  {movieId: 213, title: 'Mad Max: Fury Road', year: 2015, duration: 120, rating: 8.1},
  {movieId: 214, title: 'Arrival', year: 2016, duration: 116, rating: 7.9},
  {movieId: 215, title: 'Get Out', year: 2017, duration: 104, rating: 7.7},
  {movieId: 216, title: 'Coco', year: 2017, duration: 105, rating: 8.4},
  {movieId: 217, title: '1917', year: 2019, duration: 119, rating: 8.2},
  {movieId: 218, title: 'Knives Out', year: 2019, duration: 130, rating: 7.9},
  {movieId: 219, title: 'Dune', year: 2021, duration: 155, rating: 8},
  {movieId: 220, title: 'Everything Everywhere All at Once', year: 2022, duration: 139, rating: 7.8}
] AS row
CREATE (:Movie {movieId: row.movieId, title: row.title, year: row.year, duration: row.duration, rating: row.rating});
UNWIND [
  {actorId: 301, name: 'Leonardo DiCaprio', dob: date('1974-11-11')},
  {actorId: 302, name: 'Tom Hanks', dob: date('1956-07-09')},
  {actorId: 303, name: 'Matthew McConaughey', dob: date('1969-11-04')},
  {actorId: 304, name: 'Christian Bale', dob: date('1974-01-30')},
  {actorId: 305, name: 'Song Kang-ho', dob: date('1967-01-17')},
  {actorId: 306, name: 'Keanu Reeves', dob: date('1964-09-02')},
  {actorId: 307, name: 'Russell Crowe', dob: date('1964-04-07')},
  {actorId: 308, name: 'Emma Stone', dob: date('1988-11-06')},
  {actorId: 309, name: 'Ryan Gosling', dob: date('1980-11-12')},
  {actorId: 310, name: 'Charlize Theron', dob: date('1975-08-07')},
  {actorId: 311, name: 'Timothee Chalamet', dob: date('1995-12-27')},
  {actorId: 312, name: 'Ana de Armas', dob: date('1988-04-30')}
] AS row
CREATE (:Actor {actorId: row.actorId, name: row.name, dob: row.dob});
UNWIND [
  {directorId: 401, name: 'Christopher Nolan'},
  {directorId: 402, name: 'Bong Joon-ho'},
  {directorId: 403, name: 'Robert Zemeckis'},
  {directorId: 404, name: 'Damien Chazelle'},
  {directorId: 405, name: 'Denis Villeneuve'}
] AS row
CREATE (:Director {directorId: row.directorId, name: row.name});
UNWIND [
  {movieId: 201, genre: 'Thriller'},
  {movieId: 202, genre: 'Thriller'},
  {movieId: 203, genre: 'Fantasy'},
  {movieId: 204, genre: 'Romance'},
  {movieId: 205, genre: 'Adventure'},
  {movieId: 206, genre: 'Romance'},
  {movieId: 207, genre: 'Thriller'},
  {movieId: 208, genre: 'Drama'},
  {movieId: 209, genre: 'Action'},
  {movieId: 210, genre: 'Drama'},
  {movieId: 211, genre: 'Sci-Fi'},
  {movieId: 212, genre: 'Fantasy'},
  {movieId: 213, genre: 'Romance'},
  {movieId: 214, genre: 'Romance'},
  {movieId: 215, genre: 'Sci-Fi'},
  {movieId: 216, genre: 'Sci-Fi'},
  {movieId: 217, genre: 'Action'},
  {movieId: 218, genre: 'Fantasy'},
  {movieId: 219, genre: 'Adventure'},
  {movieId: 220, genre: 'Adventure'},
  {movieId: 201, genre: 'Comedy'},
  {movieId: 202, genre: 'Sci-Fi'},
  {movieId: 203, genre: 'Adventure'},
  {movieId: 204, genre: 'Action'},
  {movieId: 205, genre: 'Fantasy'},
  {movieId: 206, genre: 'Adventure'},
  {movieId: 207, genre: 'Action'},
  {movieId: 208, genre: 'Sci-Fi'}
] AS row
MATCH (m:Movie {movieId: row.movieId}), (g:Genre {name: row.genre})
CREATE (m)-[:BELONGS_TO]->(g);
UNWIND [
  {actorId: 308, movieId: 201},
  {actorId: 301, movieId: 202},
  {actorId: 304, movieId: 203},
  {actorId: 307, movieId: 204},
  {actorId: 310, movieId: 205},
  {actorId: 304, movieId: 206},
  {actorId: 307, movieId: 207},
  {actorId: 301, movieId: 208},
  {actorId: 307, movieId: 209},
  {actorId: 307, movieId: 210},
  {actorId: 308, movieId: 211},
  {actorId: 309, movieId: 212},
  {actorId: 311, movieId: 213},
  {actorId: 310, movieId: 214},
  {actorId: 303, movieId: 215},
  {actorId: 311, movieId: 216},
  {actorId: 306, movieId: 217},
  {actorId: 312, movieId: 218},
  {actorId: 302, movieId: 219},
  {actorId: 311, movieId: 220},
  {actorId: 304, movieId: 201},
  {actorId: 301, movieId: 202},
  {actorId: 306, movieId: 203},
  {actorId: 301, movieId: 204},
  {actorId: 302, movieId: 205},
  {actorId: 312, movieId: 206},
  {actorId: 303, movieId: 207},
  {actorId: 304, movieId: 208},
  {actorId: 308, movieId: 209},
  {actorId: 309, movieId: 210}
] AS row
MATCH (a:Actor {actorId: row.actorId}), (m:Movie {movieId: row.movieId})
CREATE (a)-[:ACTED_IN]->(m);
UNWIND [
  {directorId: 401, movieId: 201},
  {directorId: 402, movieId: 202},
  {directorId: 403, movieId: 203},
  {directorId: 404, movieId: 204},
  {directorId: 405, movieId: 205},
  {directorId: 401, movieId: 206},
  {directorId: 402, movieId: 207},
  {directorId: 403, movieId: 208},
  {directorId: 404, movieId: 209},
  {directorId: 405, movieId: 210},
  {directorId: 401, movieId: 211},
  {directorId: 402, movieId: 212},
  {directorId: 403, movieId: 213},
  {directorId: 404, movieId: 214},
  {directorId: 405, movieId: 215},
  {directorId: 401, movieId: 216},
  {directorId: 402, movieId: 217},
  {directorId: 403, movieId: 218},
  {directorId: 404, movieId: 219},
  {directorId: 405, movieId: 220}
] AS row
MATCH (d:Director {directorId: row.directorId}), (m:Movie {movieId: row.movieId})
CREATE (d)-[:DIRECTED]->(m);
UNWIND [
  {userId: 109, movieId: 217, stars: 4},
  {userId: 110, movieId: 202, stars: 2},
  {userId: 102, movieId: 219, stars: 5},
  {userId: 104, movieId: 217, stars: 2},
  {userId: 107, movieId: 202, stars: 1},
  {userId: 103, movieId: 208, stars: 3},
  {userId: 115, movieId: 209, stars: 2},
  {userId: 106, movieId: 213, stars: 3},
  {userId: 101, movieId: 216, stars: 3},
  {userId: 113, movieId: 204, stars: 4},
  {userId: 108, movieId: 216, stars: 4},
  {userId: 108, movieId: 209, stars: 2},
  {userId: 101, movieId: 207, stars: 3},
  {userId: 105, movieId: 220, stars: 5},
  {userId: 109, movieId: 202, stars: 5},
  {userId: 109, movieId: 212, stars: 1},
  {userId: 102, movieId: 217, stars: 4},
  {userId: 107, movieId: 216, stars: 4},
  {userId: 114, movieId: 207, stars: 1},
  {userId: 111, movieId: 211, stars: 1},
  {userId: 102, movieId: 211, stars: 3},
  {userId: 115, movieId: 201, stars: 5},
  {userId: 115, movieId: 213, stars: 4},
  {userId: 108, movieId: 210, stars: 3},
  {userId: 104, movieId: 205, stars: 1},
  {userId: 110, movieId: 205, stars: 4},
  {userId: 105, movieId: 215, stars: 5},
  {userId: 104, movieId: 202, stars: 3},
  {userId: 112, movieId: 213, stars: 2},
  {userId: 112, movieId: 219, stars: 1},
  {userId: 101, movieId: 205, stars: 1},
  {userId: 107, movieId: 205, stars: 4},
  {userId: 103, movieId: 207, stars: 1},
  {userId: 113, movieId: 201, stars: 5},
  {userId: 102, movieId: 215, stars: 1}
] AS row
MATCH (u:User {userId: row.userId}), (m:Movie {movieId: row.movieId})
CREATE (u)-[:RATED {stars: row.stars, timestamp: datetime()}]->(m);
UNWIND [
  {userId1: 105, userId2: 112},
  {userId1: 106, userId2: 109},
  {userId1: 107, userId2: 111},
  {userId1: 105, userId2: 107},
  {userId1: 110, userId2: 112},
  {userId1: 106, userId2: 114},
  {userId1: 101, userId2: 102},
  {userId1: 109, userId2: 114},
  {userId1: 101, userId2: 113},
  {userId1: 106, userId2: 107}
] AS row
MATCH (u1:User {userId: row.userId1}), (u2:User {userId: row.userId2})
CREATE (u1)-[:FRIENDS_WITH]->(u2);
MATCH (n) RETURN labels(n)[0] AS label, count(*) AS total ORDER BY label;
MATCH ()-[r]->() RETURN type(r) AS relationship, count(*) AS total ORDER BY relationship;
