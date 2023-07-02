const express = require("express");
const bookTicketControllers = require("../controllers/tickets-controllers");
const validationCheck = require("../middleware/validationCheck");

const router = express.Router();

router.post("/:moviename/add/:id", validationCheck, bookTicketControllers.bookTicket);

router.patch("/:moviename/update/:movieId", validationCheck, bookTicketControllers.updateTicketStatus);

router.get("/bookedtickets", validationCheck, bookTicketControllers.bookedMoviesByLoggedinUser);

module.exports = router;