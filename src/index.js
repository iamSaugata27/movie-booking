const express = require("express");
require("dotenv").config();
require("./db/db");

const userRoutes = require("./routes/users-routes");
const moviesRoutes = require("./routes/movies-routes");
const bookTicketRoutes = require("./routes/book-ticket-routes");
const KafkaConfig = require("./utils/kafka.config");
const logger = require("./utils/logger.config")(module);

const app = express();

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    res.setHeader(
        'Access-Control-Allow-Headers',
        'Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers,X-Access-Token,XKey,Authorization'
    );

    //  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


app.use(express.json());

app.use("/api/users", userRoutes);

app.use("/api", moviesRoutes);

app.use("/api", bookTicketRoutes);

const port = 8000;

const KafkaCon = new KafkaConfig();
//KafkaCon.consume(process.env.KAFKATOPIC, (message) => console.debug("Receive message from KAFKA Producer: ", message));

app.listen(port, () => logger.info(`app is running in PORT: ${port}`))