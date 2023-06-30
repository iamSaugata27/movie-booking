const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { validationResult } = require("express-validator");
const User = require("../models/User");
const HttpError = require("../models/http-error");
const logger = require("../utils/logger.config");

const getUsers = async (req, res) => {
    let users;
    try {
        users = await User.find({}, "-password");
        logger.info(`users -> ${JSON.stringify(users)}`);
    } catch (err) {
        logger.error(err.toString());
        res.status(500).json({
            message: "Fetching users failed, Please try again later."
        });
    }
    res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const registration = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return next(
            new HttpError("Invalid inputs passed, please check your data", 422)
        );
    }
    const { firstname, lastname, loginId, email, password, confirmPassword, contactNumber } = req.body;

    if (password !== confirmPassword)
        return res.status(400).json({
            success: 0,
            message: "password did not match, please re-enter password",
        });

    let existingUSer;
    try {
        existingUSer = await User.findOne({ loginId, email });
    } catch (err) {
        return next(
            new HttpError("Signing up failed, Please try again later.", 500)
        );
    }
    if (existingUSer)
        return next(
            new HttpError(
                "could not signing in, User already exists, please login with the credentials",
                422
            )
        );

    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(password, 12);
    } catch (err) {
        return next(new HttpError("Could not create user please try again.", 500));
    }
    let createdUser = new User({
        firstname, lastname, loginId, email, password: hashedPassword, role: "user", contactNumber
    });
    try {
        await createdUser.save();
    } catch (err) {
        console.log(err);
        return next(new HttpError("Signing Up failed, please try again.", 500));
    }

    res
        .status(201)
        .json({ message: "User is created successfully", email: createdUser.email, loginId: createdUser.loginId, role: createdUser.role });
};

const login = async (req, res) => {
    const { loginId, password } = req.body;
    try {
        const existingUSer = await User.findOne({ loginId });
        if (!existingUSer)
            return res.status(403).json({
                message: "Invalid credentials found, could not logged in. Please try again."
            });

        const isValidPassword = await bcrypt.compare(password, existingUSer.password);
        if (!isValidPassword)
            return res.status(403).json({
                message:
                    "Invalid credentials found, could not logged in. Please try again."
            });

        const token = jwt.sign(
            { userid: existingUSer.id, loginId: existingUSer.loginId, role: existingUSer.role },
            process.env.JWT_KEY,
            { expiresIn: "1h" }
        );
        logger.info("Login Successfull");
        res.json({
            message: "Login Successfull",
            role: existingUSer.role,
            loginId: existingUSer.loginId,
            token: token,
        });
    } catch (err) {
        logger.error(err.toString());
        res.status(400).json({
            message: "An unknown error occured, login failed, please try again."
        });
    }
};

const resetPassword = async (req, res, next) => {
    try {
        const { loginId, newPassword, confirmNewPassword } = req.body;
        const user = await User.findOne({ loginId });
        if (newPassword === confirmNewPassword) {
            user.password = newPassword;
            await user.save();
        }
        else {
            logger.warn("entered password and confirm password did not match. try again");
            return res.status(400).json({
                message: "entered password and confirm password did not match"
            })
        }
        res.json({
            message: "Password has been reset successfully!"
        });
    }
    catch (err) {
        res.status(400).json({
            message: "entered password and confirm password did not match"
        })
    }
}

exports.getUsers = getUsers;
exports.registration = registration;
exports.login = login;
exports.resetPassword = resetPassword;