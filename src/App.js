import React, { useState, useEffect } from "react";
import axios from "axios";
import { BrowserRouter as Router, Route, Link, Routes } from "react-router-dom";
import "./App.css";

function App() {
  const [allMovies, setAllMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [movieDetails, setMovieDetails] = useState(null);
  const [top10Movies, setTop10Movies] = useState([]);
  const [movieLibrary, setMovieLibrary] = useState({
    watching: [],
    completed: [],
    onHold: [],
    dropped: [],
    planToWatch: [],
  });

  useEffect(() => {
    fetchMovies(page);
  }, [page]);

  const fetchMovies = (page) => {
    axios
      .get(
        `https://api.themoviedb.org/3/movie/popular?api_key=36e1806c8416b9d48b2c8b07372138bb&page=${page}`
      )
      .then((response) => {
        const fetchedMovies = response.data.results;
        setAllMovies(fetchedMovies);
        setFilteredMovies(fetchedMovies);
        setTop10Movies(fetchedMovies.slice(0, 10)); // Set top 10 movies
      })
      .catch((error) => {
        console.error("Error fetching movies", error);
      });
  };

  const debounce = (func, delay) => {
    let debounceTimer;
    return function (...args) {
      const context = this;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => func.apply(context, args), delay);
    };
  };

  const handleSearchChange = debounce((query) => {
    setSearchQuery(query);
    if (query === "") {
      fetchMovies(page);
    } else {
      axios
        .get(
          `https://api.themoviedb.org/3/search/movie?api_key=36e1806c8416b9d48b2c8b07372138bb&query=${query}`
        )
        .then((response) => {
          const searchedMovies = response.data.results;
          setFilteredMovies(searchedMovies);
        })
        .catch((error) => {
          console.error("Error searching movies", error);
        });
    }
  }, 300);

  const handleMovieClick = (movie) => {
    axios
      .get(
        `https://api.themoviedb.org/3/movie/${movie.id}?api_key=36e1806c8416b9d48b2c8b07372138bb`
      )
      .then((response) => {
        setMovieDetails(response.data);
      })
      .catch((error) => {
        console.error("Error fetching movie details", error);
      });
  };

  const handleStatusChange = (movieId, status) => {
    setMovieLibrary((prevLibrary) => {
      const newLibrary = { ...prevLibrary };
      for (const category in newLibrary) {
        newLibrary[category] = newLibrary[category].filter(
          (movie) => movie.id !== movieId
        );
      }
      const movie = allMovies.find((movie) => movie.id === movieId);
      newLibrary[status].push(movie);
      return newLibrary;
    });
  };

  const nextPage = () => setPage(page + 1);
  const prevPage = () => setPage(page - 1);

  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <div className="menu-icon">
            <Link to="/library">
              <div className="hamburger-menu">
                <div className="bar"></div>
                <div className="bar"></div>
                <div className="bar"></div>
              </div>
            </Link>
          </div>
          <h1>My Movie List</h1>
          <div className="search-container">
            <input
              type="text"
              placeholder="Search for a movie..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="search-bar"
            />
          </div>
        </header>

        <Routes>
          <Route
            path="/"
            element={
              <main>
                <div className="movie-container">
                  {filteredMovies.length > 0 ? (
                    filteredMovies.map((movie) => (
                      <div
                        key={movie.id}
                        className="movie-card"
                        onClick={() => handleMovieClick(movie)}
                      >
                        <img
                          src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                          alt={movie.title}
                          className="movie-image"
                        />
                        <h2 className="movie-title">{movie.title}</h2>
                      </div>
                    ))
                  ) : (
                    <p>No movies found</p>
                  )}
                </div>

                <section className="top-10-section">
                  <h2>Top 10 Movies</h2>
                  <ul>
                    {top10Movies.map((movie) => (
                      <li key={movie.id} onClick={() => handleMovieClick(movie)}>
                        {movie.title}
                      </li>
                    ))}
                  </ul>
                </section>
              </main>
            }
          />

          <Route
            path="/library"
            element={
              <div className="movie-library">
                <h2>Movie Library</h2>
                {Object.keys(movieLibrary).map((status) => (
                  <div key={status} className="library-section">
                    <h3>{status.replace(/([A-Z])/g, " $1")}</h3>
                    <div className="library-movies">
                      {movieLibrary[status].map((movie) => (
                        <div key={movie.id} className="library-movie-card">
                          <img
                            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                            alt={movie.title}
                            className="movie-image"
                          />
                          <h4>{movie.title}</h4>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            }
          />
        </Routes>

        {movieDetails && (
          <div className="movie-modal">
            <div className="modal-content">
              <span
                className="close-modal"
                onClick={() => setMovieDetails(null)}
              >
                &times;
              </span>
              <div className="modal-header">
                <img
                  src={`https://image.tmdb.org/t/p/w500${movieDetails.poster_path}`}
                  alt={movieDetails.title}
                  className="movie-detail-image"
                />
                <div className="movie-detail-info">
                  <h2>{movieDetails.title}</h2>
                  <p>Rating: {movieDetails.vote_average}</p>
                  <p>Release Date: {movieDetails.release_date}</p>
                  <p>Runtime: {movieDetails.runtime} minutes</p>
                  <p>
                    Genres:{" "}
                    {movieDetails.genres
                      ? movieDetails.genres.map((genre) => genre.name).join(", ")
                      : "N/A"}
                  </p>
                </div>
              </div>
              <div className="modal-body">
                <h3>Overview</h3>
                <p>{movieDetails.overview}</p>
                <div>
                  <select
                    onChange={(e) =>
                      handleStatusChange(movieDetails.id, e.target.value)
                    }
                  >
                    <option value="">Select Status</option>
                    <option value="watching">Watching</option>
                    <option value="completed">Completed</option>
                    <option value="onHold">On Hold</option>
                    <option value="dropped">Dropped</option>
                    <option value="planToWatch">Plan to Watch</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="pagination">
          <button onClick={prevPage} disabled={page === 1}>
            Previous
          </button>
          <span>Page {page}</span>
          <button onClick={nextPage}>Next</button>
        </div>

        <footer className="footer">
          <div className="footer-content">
            <div className="footer-left">
              <p>© Movie List — by SpikyHighVirus</p>
            </div>
            <div className="footer-right">
              <a href="https://github.com/SpikyHighVirus" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-github social-icon"></i>
              </a>
              <a href="https://www.instagram.com/spikyhighvirus" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-instagram social-icon"></i>
              </a>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
