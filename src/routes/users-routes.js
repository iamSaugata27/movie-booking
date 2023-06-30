const express = require("express");
const { check } = require("express-validator");

const userControllers = require("../controllers/users-controllers");
const router = express.Router();

router.get("/", userControllers.getUsers);

router.post("/registration", userControllers.registration);

router.post("/login", userControllers.login);

router.post("/resetPassword", userControllers.resetPassword);

module.exports = router;