const { Kafka, logLevel } = require("kafkajs");

class KafkaConfig {
    constructor() {
        this.kafka = new Kafka({
            // logLevel: logLevel.DEBUG,
            clientId: "movie-booking",
            brokers: ["localhost:9092"],
        });
        this.producer = this.kafka.producer();
        this.consumer = this.kafka.consumer({ groupId: "test movie-booking" });
    }

    async produce(topic, message) {
        try {
            await this.producer.connect();
            await this.producer.send({
                topic: topic,
                messages: [
                    {
                        value: message
                    }
                ]
            });
        } catch (error) {
            console.error(error);
        } finally {
            await this.producer.disconnect();
        }
    }

    async consume(topic, callback) {
        try {
            await this.consumer.connect();
            await this.consumer.subscribe({ topic: topic, fromBeginning: true });
            await this.consumer.run({
                eachMessage: async ({ topic, partition, message }) => {
                    const value = `From topic ${topic} -> ${message.value}`;
                    callback(value);
                },
            });
        } catch (error) {
            console.error(error);
        }
    }
}
module.exports = KafkaConfig;