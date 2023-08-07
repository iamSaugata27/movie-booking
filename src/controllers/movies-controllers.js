const Movie = require("../models/movie");
const Tickets = require("../models/Tickets");
const KafkaConfig = require("../utils/kafka.config");
const logger = require("../utils/logger.config")(module);

const getMovies = async (req, res) => {
    try {
        const movies = await Movie.find({});
        const allMovies = [];
        for (const movie of movies) {
            const ticket = await Tickets.findOne({ movieId: movie.id });
            let movieObj = {};
            if (ticket)
                movieObj = { ...movie._doc, status: ticket.availablelityStatus };
            else
                movieObj = { ...movie._doc, status: "Booking Open" };
            allMovies.push(movieObj);
        }
        const KafkaCon = new KafkaConfig();
        //KafkaCon.produce(process.env.KAFKATOPIC, `Fetching movies- ${JSON.stringify(movies)}`);
        res.json(allMovies);
    }
    catch (err) {
        logger.error(err.message);
    }
}

const createMoviePoster = async (req, res) => {
    const { movieName, theatreName, noOfTickets } = req.body;
    let releaseDate = new Date(req.body.releaseDate);
    const role = req.role;
    if (role === "admin") {
        const createdMovie = new Movie({
            movieName, theatreName, noOfTickets, releaseDate
        });
        try {
            const existedMovie = await Movie.findOne({ movieName, theatreName });
            if (!existedMovie) {
                await createdMovie.save();
                const KafkaCon = new KafkaConfig();
                KafkaCon.produce(process.env.KAFKATOPIC, `Created movie- ${JSON.stringify(createdMovie)}`);
                res.status(201).json({
                    message: `${movieName} has been created successfully`,
                    createdBy: req.user
                });
            }
            else
                res.status(400).json({
                    message: 'Movie already exists in the same theatre, try with another movie name or theatre name'
                })
        }
        catch (err) {
            logger.error(err.message);
            res.status(500).json({
                message: "Unable to create movie"
            });
        }
    }
    else
        return res.status(403).json({
            message: "You have no access to post a movie"
        });
}


const updateMoviePoster = async (req, res, next) => {
    const { movieName, theatreName, noOfTickets, releaseDate } = req.body;
    const movieId = req.params.id;
    const role = req.role;
    if (role === "admin") {
        const existedMovie = await Movie.findById(movieId);
        if (existedMovie) {
            try {
                await Movie.updateOne({ _id: movieId }, { $set: { theatreName, noOfTickets, releaseDate } });
                res.json({
                    message: 'Updated successfully'
                });
            }
            catch (err) {
                console.log(err);
                res.status(500).json({
                    message: 'An error occured to Update movie details'
                })
            }
        }
        else {
            res.status(404).json({
                message: `No movie present with the name ${movieName}`
            });
        }
    }
    else
        return res.status(403).json({
            message: "You have no access to post a movie"
        });
}


const deleteMovie = async (req, res) => {
    const movieId = req.params.id;
    const role = req.role;
    if (role === "admin") {
        try {
            const deletedMovie = await Movie.findOneAndDelete({ _id: movieId });
            await Tickets.deleteOne({ movieId });
            logger.info(`The movie ${deletedMovie.movieName} has been deleted`);
            const KafkaCon = new KafkaConfig();
            KafkaCon.produce(process.env.KAFKATOPIC, `Deleted movie- ${JSON.stringify(deletedMovie)}`);
            res.json({
                message: `The movie ${deletedMovie.movieName} from theatre ${deletedMovie.theatreName} has been deleted successfully`
            })
        }
        catch (err) {
            logger.error(err.message);
            res.status(500).json({
                message: "Unable to delete movie"
            });
        }
    }
    else
        return res.status(403).json({
            message: "You have no access to delete a movie"
        });
}

const searchByMoviename = async (req, res) => {
    const searchInMovie = req.params.moviename;
    // const searchText = new RegExp(searchInMovie, "i");
    try {
        // const movies = await Movie.find({ movieName: searchText });
        const movies = await Movie.find({ movieName: { $regex: searchInMovie, $options: 'i' } });
        const KafkaCon = new KafkaConfig();
        KafkaCon.produce(process.env.KAFKATOPIC, `Searched movies- ${JSON.stringify(movies)}`);
        logger.info(`You have searched a movie with name ${searchInMovie}`);
        res.json({
            movies
        });
    }
    catch (err) {
        logger.error(err);
        res.status(500).json({
            message: "Unable to search movie"
        });
    }
}


exports.getMovies = getMovies;
exports.createMoviePoster = createMoviePoster;
exports.deleteMovie = deleteMovie;
exports.searchByMoviename = searchByMoviename;