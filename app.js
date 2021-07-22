const express = require("express");
const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "moviesData.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertToMovieName = (item) => {
  return {
    movieId: item.movie_id,
    directorId: item.director_id,
    movieName: item.movie_name,
    leadActor: item.lead_actor,
  };
};

const convertDirectorItem = (item) => {
  return {
    directorId: item.director_id,
    directorName: item.director_name,
  };
};

//Get list of movie names

app.get("/movies/", async (request, response) => {
  const getMoviesQuery = `
    select movie_name
    from
        movie
    `;
  const moviesList = await db.all(getMoviesQuery);
  response.send(moviesList.map((eachItem) => convertToMovieName(eachItem)));
});

// Add movie

app.post("/movies/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;
  const addMovieQuery = `
    insert into 
    movie (director_id,movie_name,lead_actor)
    values
    (${directorId},
    '${movieName}',
    '${leadActor}');
    `;
  await db.run(addMovieQuery);
  response.send("Movie Successfully Added");
});

//Get Movie

app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieQuery = `
    select * 
    from movie
    where
    movie_id = ${movieId};
    `;
  const movieItem = await db.get(getMovieQuery);

  response.send(convertToMovieName(movieItem));
});

// update movie details

app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const { directorId, movieName, leadActor } = request.body;

  const updateMovieQuery = `
        update movie
        set 
        director_id = ${directorId},
        movie_name = '${movieName}',
        lead_actor='${leadActor}'
        where
        movie_id = ${movieId};
    `;
  await db.run(updateMovieQuery);
  response.send("Movie Details Updated");
});

//delete movie

app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieQuery = `
    delete from
    movie 
    where movie_id = ${movieId}
    `;
  await db.run(deleteMovieQuery);
  response.send("Movie Removed");
});

//List of Directors
app.get("/directors/", async (request, response) => {
  const directorsQuery = `
    select *
    from director ; `;
  const directorList = await db.all(directorsQuery);
  response.send(
    directorList.map((eachItem) => {
      return convertDirectorItem(eachItem);
    })
  );
});

//movie names directed by a specific director

app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const movieListQuery = `
    select movie_name 
    from movie inner join director on 
    movie.director_id = director.director_id
    where 
    movie.director_id = ${directorId};
    `;
  const movieList = await db.all(movieListQuery);
  response.send(movieList.map((eachItem) => convertToMovieName(eachItem)));
});

module.exports = app;
