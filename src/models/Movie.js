const { Schema, model } = require("mongoose");

const movieSchema = new Schema({
    movieName: {
        type: String,
        required: true
    },
    theatreName: {
        type: String,
        required: true
    },
    noOfTickets: {
        type: Number,
        required: true
    },
    releaseDate: {
        type: Date,
        required: true,
    },
    seatNumber: {
        type: [Schema.Types.Number]
    }
});

const Movie = model("Movie", movieSchema);

module.exports = Movie;