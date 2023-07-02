const Tickets = require("../models/Tickets");
const Movie = require("../models/movie");
const logger = require("../utils/logger.config")(module);
const KafkaConfig = require("../utils/kafka.config");


const bookTicket = async (req, res) => {
    const moviename = req.params.moviename;
    const movieId = req.params.id;
    const noOfSeatsWantToBook = req.body.seatCount;
    const choicedSeatNumbers = req.body.seatNumbers.split(',').map((seat) => parseInt(seat));
    const loggedInUserid = req.userid;
    try {
        const KafkaCon = new KafkaConfig();
        const movie = await Movie.findById(movieId);
        const alreadyBookedSeats = choicedSeatNumbers.filter(choicedSeat => movie.seatNumber.includes(choicedSeat));
        const existedMovieTicket = await Tickets.findOne({ movieId });
        let noOfTicketsAlreadyBooked = existedMovieTicket?.noOfTicketsBooked ? existedMovieTicket?.noOfTicketsBooked : 0;
        if (alreadyBookedSeats.length < 1 && movie.noOfTickets >= noOfTicketsAlreadyBooked + noOfSeatsWantToBook) {
            await Movie.findByIdAndUpdate(movieId, { $push: { seatNumber: { $each: choicedSeatNumbers } } });
            if (existedMovieTicket) {
                let isMovieBookedByLoggedInUser = false;
                for (const userSeatInfo of existedMovieTicket.bookedUsers) {
                    if (userSeatInfo.userid.toString() === loggedInUserid) {
                        isMovieBookedByLoggedInUser = true;
                        userSeatInfo.seatNumbers = [...choicedSeatNumbers, ...userSeatInfo.seatNumbers];
                        break;
                    }
                }
                if (!isMovieBookedByLoggedInUser)
                    existedMovieTicket.bookedUsers.push({ userid: loggedInUserid, seatNumbers: choicedSeatNumbers });
                existedMovieTicket.noOfTicketsBooked = noOfTicketsAlreadyBooked + noOfSeatsWantToBook;
                await existedMovieTicket.save();
                logger.info("Movie booked succcessfully");
                KafkaCon.produce(process.env.KAFKATOPIC, `Existed movie ticket updated- ${JSON.stringify(existedMovieTicket)}`);
            }
            else {
                const ticketBook = new Tickets({
                    movieId, bookedUsers: [{ userid: loggedInUserid, seatNumbers: choicedSeatNumbers }], noOfTicketsBooked: noOfSeatsWantToBook
                });
                await ticketBook.save();
                logger.info("Movie booked succcessfully");
                KafkaCon.produce(process.env.KAFKATOPIC, `Booked ticket- ${JSON.stringify(ticketBook)}`);
            }
            return res.json({
                message: "Movie booked successfully"
            })
        }
        else
            return res.status(400).json({
                message: `The seat no. ${alreadyBookedSeats.join(',')} ${alreadyBookedSeats.length > 1 ? 'are' : 'is'} already booked, please try with another seats`
            });
    }
    catch (err) {
        logger.error(err.message);
        res.status(400).json({
            message: "Unable to book movie",
            error: err.message
        });
    }
}


const updateTicketStatus = async (req, res) => {
    const moviename = req.params.moviename;
    const movieId = req.params.movieId;
    // const ticketId = req.params.ticketId;
    const role = req.role;
    if (role === "admin") {
        try {
            const KafkaCon = new KafkaConfig();
            const ticket = await Tickets.findOne({ movieId });
            const movie = await Movie.findById(movieId);
            const noOfAvailableTickets = movie?.noOfTickets - ticket?.noOfTicketsBooked;
            if (ticket) {
                if (noOfAvailableTickets == 0)
                    ticket.availablelityStatus = "SOLD OUT";
                else
                    ticket.availablelityStatus = "BOOK ASAP";
                await ticket.save();
                logger.info(`The availability status of ${moviename} has been updated successfully`);
                KafkaCon.produce(process.env.KAFKATOPIC, `Ticket availability status updated successfully`);
            }
            res.json({
                message: `The availability status of ${moviename} has been updated successfully`,
                ticketInfo: ticket
            });
        }
        catch (err) {
            logger.error(err.message);
            res.status(500).json({
                message: "An unknown error occured to update movie status"
            })
        }
    }
    else
        return res.status(403).json({
            message: "You have no access to update the movie availability status"
        });
}


const bookedMoviesByLoggedinUser = async (req, res) => {
    const loggedInUserid = req.userid;
    try {
        const ticket = await Tickets.find({ bookedUsers: { $elemMatch: { userid: loggedInUserid } } }).populate(
            [{
                path: 'movieId',
                select: 'movieName theatreName releaseDate'
            },
            {
                path: 'bookedUsers',
                populate: {
                    path: 'userid',
                    select: 'loginId'
                }
            }]
        );
        const bookedMoviesDeatil = [];
        if (ticket) {
            // ticket.forEach(object =>
            //     object.bookedUsers = object.bookedUsers.filter(user => user.userid.id === loggedInUserid)
            // );
            ticket.forEach(object => {
                const movieObject = {
                    movieName: '',
                    theatreName: '',
                    releaseDate: '',
                    loginId: '',
                    bookedSeats: []
                };
                movieObject.movieName = object.movieId.movieName;
                movieObject.theatreName = object.movieId.theatreName;
                movieObject.releaseDate = object.movieId.releaseDate;
                object.bookedUsers.forEach(userObj => {
                    if (userObj.userid.id === loggedInUserid) {
                        movieObject.loginId = userObj.userid.loginId;
                        movieObject.bookedSeats = userObj.seatNumbers;
                    }
                });
                bookedMoviesDeatil.push(movieObject);
            });
            return res.json({
                bookedTickets: bookedMoviesDeatil
            });
        }
        else
            return res.status(404).json({
                message: "Sorry, there is no ticket booked by you, Hurry up!! to book a ticket"
            });
    }
    catch (err) {
        logger.error(err.message);
        res.status(500).json({
            message: "An unknown error occured to fetch the booked movies"
        })
    }
}


exports.bookTicket = bookTicket;
exports.updateTicketStatus = updateTicketStatus;
exports.bookedMoviesByLoggedinUser = bookedMoviesByLoggedinUser;