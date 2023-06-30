const Movie = require("../models/movie");
const Tickets = require("../models/Tickets");
const produce = require("../utils/kafka-producer");
const KafkaConfig = require("../utils/kafka.config");

const getMovies = async (req, res, next) => {
    try {
        const movies = await Movie.find({});
        // await produce(`Fetching movies ${JSON.stringify(movies)}`)
        const KafkaCon = new KafkaConfig();
        KafkaCon.produce(process.env.KAFKATOPIC, `Fetching movies- ${JSON.stringify(movies)}`);
        res.json({ movies });
    }
    catch (err) {
        console.log(err);
        next(err)
    }
}

const createMoviePoster = async (req, res, next) => {
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
            // res.status(500).json({
            //     message: "Unable to create movie"
            // });
            console.log(err);
            next(err);
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


const deleteMovie = async (req, res, next) => {
    const movieId = req.params.id;
    const role = req.role;
    if (role === "admin") {
        try {
            const deletedMovie = await Movie.findOneAndDelete({ _id: movieId });
            await Tickets.deleteOne({ movieId });
            res.json({
                message: `The movie ${deletedMovie.movieName} from theatre ${deletedMovie.theatreName} has been deleted successfully`
            })
        }
        catch (err) {
            console.log(err);
            next(err);
        }
    }
    else
        return res.status(403).json({
            message: "You have no access to delete a movie"
        });
}

const searchByMoviename = async (req, res, next) => {
    const searchInMovie = req.params.moviename;
    const searchText = new RegExp(searchInMovie, "i");
    try {
        const movies = await Movie.find({ movieName: searchText });
        const KafkaCon = new KafkaConfig();
        KafkaCon.produce(process.env.KAFKATOPIC, `Searched movies- ${JSON.stringify(movies)}`);
        res.json({
            movies
        });
    }
    catch (err) {
        console.log(err);
        next(err);
    }
}


exports.getMovies = getMovies;
exports.createMoviePoster = createMoviePoster;
exports.deleteMovie = deleteMovie;
exports.searchByMoviename = searchByMoviename;