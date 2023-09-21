const { Schema, model } = require("mongoose");

const ticketSchema = new Schema({
    movieId: {
        type: Schema.Types.ObjectId,
        unique: true,
        ref: 'Movie'
    },
    bookedUsers: [
        {
            userid: {
                type: Schema.Types.ObjectId,
                ref: 'User'
            },
            seatNumbers: {
                type: [Schema.Types.Number]
            }
        }
    ],
    noOfTicketsBooked: {
        type: Number,
        required: true
    },
    availablelityStatus: {
        type: String,
        default: "BOOKING STARTED"
    }
});

const Tickets = model("Tickets", ticketSchema);

module.exports = Tickets;