const { Kafka, logLevel } = require("kafkajs");

const produce = async (message) => {
    const kafka = new Kafka({
        logLevel: logLevel.INFO,
        clientId: "movie-booking",
        brokers: [`${process.env.KAFKAHOST}:9092`]
    });

    const producer = kafka.producer();
    await producer.connect();

    console.log("Producer connected");

    const producedData = await producer.send({
        topic: "booking-start",
        messages: [
            {
                value: message
            },
        ],
    });
    console.log(`Produced data ${JSON.stringify(producedData)}`);
}

module.exports = produce;