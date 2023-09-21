const express = require("express");
const { check } = require("express-validator");

const userControllers = require("../controllers/users-controllers");
const validationCheck = require("../middleware/validationCheck");
const router = express.Router();

router.get("/", validationCheck, userControllers.getUsers);

router.post("/registration", userControllers.registration);

router.post("/login", userControllers.login);

router.post("/resetPassword", userControllers.resetPassword);

router.delete("/deleteuser/:loginId", validationCheck, userControllers.deleteUser);

router.get("/forgotPassword/:userIdentity", userControllers.forgotPassword);

router.post("/verifyOTP", userControllers.verifyOTP);

router.post("/makeAdmin", validationCheck, userControllers.makeAsAdmin);

module.exports = router;