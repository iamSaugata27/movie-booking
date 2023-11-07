FROM node:latest
WORKDIR /usr/src/app
COPY package.json .
RUN npm install
COPY . .
ENV JWT_KEY=secretKey
ENV JWT_EXPIRES_IN=1h
ENV OTP_SECRET=myOTPSecretKey
ENV KAFKAHOST=127.0.0.1
ENV KAFKATOPIC=booking-start
ENV SENDER_MAIL=mail_id
ENV SENDER_MAILPASS=mail_pass
ENV OTP_EXPIRY_TIME_IN_MINUTES=5
ENV MONGODBHOST=mongodb://127.0.0.1:27017
ENV MONGODB_ATLAS_HOST=MONGO_ATLAS_URL
CMD [ "npm", "run", "server" ]
EXPOSE 8000
