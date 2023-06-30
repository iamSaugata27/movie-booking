const express = require("express");
const moviesControllers = require("../controllers/movies-controllers");
const validationCheck = require("../middleware/validationCheck");

const router = express.Router();

router.get("/all", moviesControllers.getMovies);

router.get("/movies/search/:moviename", moviesControllers.searchByMoviename);

router.post("/createmovieposter", validationCheck, moviesControllers.createMoviePoster);

router.delete("/:moviename/delete/:id", validationCheck, moviesControllers.deleteMovie);

module.exports = router;