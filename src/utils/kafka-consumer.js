const { Kafka, logLevel } = require("kafkajs");

const consume = async (logType) => {
    const kafka = new Kafka({
        logLevel: logType,
        clientId: "movie-booking",
        brokers: ['127.0.0.1:9092']
    });

    const consumer = kafka.consumer({ groupId: "book-movie" });
    await consumer.connect();
    console.log("Consumer connected");

    await consumer.subscribe({
        topic: "booking-start",
        fromBeginning: true,
    });

    await consumer.run({
        eachMessage: async ({ topic, message }) => {
            console.log(
                `To Topic ${topic} -> message ${message.value.toString()}`
            );
        },
    });
}

consume(logLevel.DEBUG);