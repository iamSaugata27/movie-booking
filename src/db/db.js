const mongoose = require("mongoose");
const logger = require("../utils/logger.config")(module);

mongoose.connect(`${process.env.MONGODB_ATLAS_HOST}/moviebooking`).then(() => logger.info("db connected")).catch((err) => logger.error(`db is not connected. Error-> ${err}`));
