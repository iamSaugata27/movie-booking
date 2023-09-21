const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cryptoJS = require("crypto-js");
const User = require("../models/User");
const OTPModel = require("../models/OTP");
const KafkaConfig = require("../utils/kafka.config");
const sendEmail = require("../utils/sendEmail");
const logger = require("../utils/logger.config")(module);

const getUsers = async (req, res) => {
    const role = req.role;
    if (role === "admin") {
        try {
            const users = await User.find({}, 'firstname lastname loginId email role contactNumber -_id');
            logger.info(`users -> ${JSON.stringify(users)}`);
            return res.json(users.map((user) => user.toObject({ getters: true })));
        } catch (err) {
            logger.error(err.toString());
            res.status(500).json({
                message: "Fetching users failed, Please try again later."
            });
        }
    }
    else
        return res.status(403).json({
            error: "You have no access to see all the users"
        });
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
            { expiresIn: process.env.JWT_EXPIRES_IN }
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
        if (newPassword === confirmNewPassword) {
            const hashedPassword = await bcrypt.hash(newPassword, 12);
            await User.findOneAndUpdate({ loginId }, { $set: { password: hashedPassword } });
            logger.info(`Password has been reset for user ${loginId}`);
        }
        else {
            logger.warn("entered password and confirmed password did not match. try again");
            return res.status(400).json({
                message: "entered password and confirmed password did not match"
            })
        }
        res.json({
            message: "Password has been reset successfully!"
        });
    }
    catch (err) {
        res.status(400).json({
            message: "An unexpected error occured to change your password, try again!"
        })
    }
}

const forgotPassword = async (req, res) => {
    const userIdentity = req.params.userIdentity;
    try {
        const user = await User.findOne({ $or: [{ loginId: userIdentity }, { email: userIdentity }] });
        if (!user)
            return res.status(404).json({
                error: `No user is found for the given loginId, please enter a proper email or loginId`
            });
        const OTP = Math.round(Math.random() * 10000).toString().padStart(4, '0');   //using 0000 and 4 for making four digit OTP
        const cryptedOTP = cryptoJS.AES.encrypt(OTP, process.env.OTP_SECRET).toString();
        const expiredAt = new Date(new Date().setMinutes(new Date().getMinutes() + parseInt(process.env.OTP_EXPIRY_TIME_IN_MINUTES)));
        await OTPModel.findOneAndUpdate({ loginId: user.loginId }, { $set: { OTP: cryptedOTP, expiredAt } }, { upsert: true, new: true });
        await sendEmail(OTP, user.email);
        return res.json({
            message: "OTP sent successfully",
            loginId: user.loginId
        });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({
            error: "Some unexpected error occured to recover your ID"
        });
    }
}

const verifyOTP = async (req, res) => {
    const { loginId, enteredOTP } = req.body;
    try {
        const userOTP = await OTPModel.findOne({ loginId });
        if (!userOTP)
            return res.status(404).json({
                error: `No user's OTP is found for the given loginId`
            });
        const bytes = cryptoJS.AES.decrypt(userOTP.OTP, process.env.OTP_SECRET);
        const originalOTP = bytes.toString(cryptoJS.enc.Utf8);
        const isOTPexpired = new Date() <= userOTP.expiredAt ? false : true;
        if (enteredOTP === originalOTP && !isOTPexpired)
            return res.json({
                OTPmatched: true
            });
        else
            return res.json({
                OTPmatched: false
            });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({
            error: "Some unexpected error occured to verify your ID"
        });
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

const makeAsAdmin = async (req, res) => {
    const role = req.role;
    const loginId = req.body.loginId;
    if (role === "admin") {
        try {
            await User.findOneAndUpdate({ loginId }, { $set: { role: 'admin' } });
            logger.info(`${req.user} made ${loginId} as an admin`);
            res.json({ message: `${loginId}'s role has been updated successfully!` });
        }
        catch (err) {
            logger.error(err.message);
            res.status(500).json({
                message: `Could not make admin, try again!`
            });
        }
    }
}


exports.getUsers = getUsers;
exports.registration = registration;
exports.login = login;
exports.resetPassword = resetPassword;
exports.deleteUser = deleteUser;
exports.forgotPassword = forgotPassword;
exports.verifyOTP = verifyOTP;
exports.makeAsAdmin = makeAsAdmin;