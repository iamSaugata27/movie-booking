const mongoose = require("mongoose");
const logger = require("../utils/logger.config");

mongoose.connect("mongodb://localhost:27017/moviebooking").then(() => logger.info("db connected")).catch((err) => logger.error(`db is not connected. Error-> ${err}`));
