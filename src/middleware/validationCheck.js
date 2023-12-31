const jwt = require("jsonwebtoken");
const logger = require("../utils/logger.config")(module);

const validationCheck = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token)
        return res.status(400).json({
            success: 0,
            message: "No token has been given, authorization denied",
        });
    try {
        const decoded_token = jwt.verify(token, process.env.JWT_KEY);
        req.userid = decoded_token.userid;
        req.user = decoded_token.loginId;
        req.role = decoded_token.role;
        logger.debug(`Validation check successfull for role ${decoded_token.role}`);
        next();
    } catch (err) {
        logger.error(err.message)
        res.status(401).json({
            success: 0,
            message: "Authorization failed, please autheticate",
        });
    }
}

module.exports = validationCheck;