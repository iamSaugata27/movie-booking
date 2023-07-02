const registrationDummyData = {
    "firstname": "John",
    "lastname": "Paul",
    "loginId": "John95",
    "email": "john@gmail.com",
    "password": "HelloWorld",
    "confirmPassword": "HelloWorld",
    "contactNumber": 9988777625
};

const adminCredentialData = {
    "loginId": "saugata97",
    "password": "HelloWorld"
};

const userCredentialData = {
    "loginId": "John95",
    "password": "HelloWorld"
}

const newMoviePosterDummyData = {
    "movieName": "Breaking Brad",
    "theatreName": "PVR",
    "noOfTickets": 75,
    "releaseDate": "07/13/2023"
};

const seatDetailsDummyData = {
    "seatCount": 3,
    "seatNumbers": "12,23,28"
};

const ticketUpdationStatusDummy = ["SOLD OUT", "BOOK ASAP"];

module.exports = {
    registrationDummyData, adminCredentialData, newMoviePosterDummyData, seatDetailsDummyData, userCredentialData, ticketUpdationStatusDummy
}