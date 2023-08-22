const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const User = require("../models/User");
const KafkaConfig = require("../utils/kafka.config");
const logger = require("../utils/logger.config")(module);

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
    const { firstname, lastname, loginId, email, password, confirmPassword, contactNumber } = req.body;

    if (password.length < 6)
        return res.status(400).json({
            success: 0,
            message: "Password should contains atleast 6 characters",
        });

    if (password !== confirmPassword)
        return res.status(400).json({
            success: 0,
            message: "password did not match, please re-enter password",
        });

    try {
        const KafkaCon = new KafkaConfig();
        const existingUSer = await User.findOne({ loginId });
        if (existingUSer)
            return res.status(422).json({
                errors: "Could not signing in, User already exists, try using different LoginId"
            });
        const hashedPassword = await bcrypt.hash(password, 12);
        const createdUser = new User({
            firstname, lastname, loginId, email, password: hashedPassword, role: "user", contactNumber
        });
        await createdUser.save();
        logger.debug(`User - ${createdUser.loginId} has been created successfully`);
        //KafkaCon.produce(process.env.KAFKATOPIC, `User - ${createdUser.loginId} has been created`);
        res
            .status(201)
            .json({ message: "Registration is succeded, keep remember your LoginId, it is required to login", loginId: createdUser.loginId });
    } catch (err) {
        logger.error(err.message);
        const error = err.message.includes('email') ? "Email already taken, try using different email" : err.message;
        res.status(400).json({
            message: "Signing up failed, Please try again later.",
            errors: error
        });
    }
};

const login = async (req, res) => {
    const { loginId, password } = req.body;
    try {
        const KafkaCon = new KafkaConfig();
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
        //KafkaCon.produce(process.env.KAFKATOPIC, `${existingUSer.loginId} logged in with token: ${token}`);
        res.json({
            message: "Login Successfull",
            role: existingUSer.role,
            loginId: existingUSer.loginId,
            token: token,
        });
    } catch (err) {
        logger.error(err.message);
        res.status(400).json({
            message: "An unknown error occured, login failed, please try again."
        });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { loginId, newPassword, confirmNewPassword } = req.body;
        const user = await User.findOne({ loginId });
        if (newPassword === confirmNewPassword) {
            user.password = newPassword;
            await user.save();
            logger.info(`Password has been reset for user ${loginId}`);
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

const deleteUser = async (req, res) => {
    const role = req.role;
    const toBeDeleteUserId = req.params.loginId;
    try {
        const KafkaCon = new KafkaConfig();
        if (role === "admin") {
            const deletedUser = await User.findOneAndDelete({ loginId: toBeDeleteUserId });
            if (!deletedUser)
                return res.status(404).json({
                    message: `Could not find user ${toBeDeleteUserId}`
                });
            logger.info(`${toBeDeleteUserId} has been deleted`);
            KafkaCon.produce(process.env.KAFKATOPIC, `${toBeDeleteUserId} has been deleted`);
            res.json({
                message: `${toBeDeleteUserId} has been deleted successfully`
            });
        }
        else
            return res.status(403).json({
                message: "You have no access to delete a user"
            });
    }
    catch (err) {
        logger.error(err.message);
        res.status(500).json({
            message: `Could not delete the user ${toBeDeleteUserId}`
        });
    }
};


exports.getUsers = getUsers;
exports.registration = registration;
exports.login = login;
exports.resetPassword = resetPassword;
exports.deleteUser = deleteUser;