const axios = require("axios");
const { registrationDummyData, adminCredentialData, newMoviePosterDummyData, userCredentialData, seatDetailsDummyData, ticketUpdationStatusDummy } = require("./testdata");

const axiosInstance = axios.create({
    baseURL: "http://localhost:8000/api"
});

async function sleep(milisecond) {
    await new Promise((resolve) => setTimeout(resolve, milisecond))
}

var createdMovieId = '';


afterAll(async () => {
    const respLogin = await axiosInstance.post("/users/login", adminCredentialData);
    const token = respLogin.data.token;
    const loginId = registrationDummyData.loginId;
    await axiosInstance.delete(`/users/deleteuser/${loginId}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
});

test("Testing user registration", async () => {
    await axiosInstance.post("/users/registration", registrationDummyData);
    const respGetAllUsers = await axiosInstance.get("/users");
    let isUserRegistered = false;
    for (let user of respGetAllUsers.data.users) {
        if (user.loginId === registrationDummyData.loginId) {
            isUserRegistered = true;
            break;
        }
    }
    expect(isUserRegistered).toBeTruthy();
});

test("Testing for create a movie", async () => {
    const respLogin = await axiosInstance.post("/users/login", adminCredentialData);
    const token = respLogin.data.token;
    await axiosInstance.post("/createmovieposter", newMoviePosterDummyData, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    const allMovies = await axiosInstance.get("/all");
    let isMovieCreated = false;
    for (let movie of allMovies.data.movies) {
        if (movie.movieName === newMoviePosterDummyData.movieName && movie.theatreName === newMoviePosterDummyData.theatreName) {
            isMovieCreated = true;
            createdMovieId = movie._id;
            break;
        }
    }
    expect(isMovieCreated).toBeTruthy();
});

test("Testing for movie search by giving a keyword", async () => {
    const moviename = 'Breaking';
    const respData = await axiosInstance.get(`/movies/search/${moviename}`);
    const searchedMovies = respData.data.movies.filter(movie => movie.movieName.toLowerCase().includes(moviename.toLowerCase()));
    expect(searchedMovies.length).toBe(respData.data.movies.length);
});

test("Testing for booking a ticket", async () => {
    const respLogin = await axiosInstance.post("/users/login", userCredentialData);
    const token = respLogin.data.token;
    const moviename = newMoviePosterDummyData.movieName;
    const id = createdMovieId;
    await axiosInstance.post(`${moviename}/add/${id}`, seatDetailsDummyData, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    const getBookedTicketDetailsByUser = await axiosInstance.get("/bookedtickets", {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    let isMovieTicketBooked = false;
    for (let userTicketInfo of getBookedTicketDetailsByUser.data.bookedTickets) {
        if (userTicketInfo.movieName === newMoviePosterDummyData.movieName && userTicketInfo.theatreName === newMoviePosterDummyData.theatreName && userTicketInfo.loginId === userCredentialData.loginId) {
            isMovieTicketBooked = true;
            break;
        }
    }
    expect(isMovieTicketBooked).toBeTruthy();
});

test("Testing for updation of movie status based on ticket availability", async () => {
    const respLogin = await axiosInstance.post("/users/login", adminCredentialData);
    const token = respLogin.data.token;
    const moviename = newMoviePosterDummyData.movieName;
    const movieId = createdMovieId;
    const updatedTicketInfo = await axiosInstance.patch(`/${moviename}/update/${movieId}`, {}, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    const expectedStatus = [updatedTicketInfo.data.ticketInfo.availablelityStatus];
    expect(ticketUpdationStatusDummy).toEqual(expect.arrayContaining(expectedStatus));
});

test("Testing for deletion a movie", async () => {
    const respLogin = await axiosInstance.post("/users/login", adminCredentialData);
    const token = respLogin.data.token;
    const moviename = newMoviePosterDummyData.movieName;
    const id = createdMovieId;
    await axiosInstance.delete(`/${moviename}/delete/${id}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    const allMovies = await axiosInstance.get("/all");
    const isMovieExisted = false;
    for (let movie of allMovies.data.movies) {
        if (movie.movieName === newMoviePosterDummyData.movieName && movie.theatreName === newMoviePosterDummyData.theatreName) {
            isMovieExisted = true;
            break;
        }
    }
    expect(isMovieExisted).toBeFalsy();
});