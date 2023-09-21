const { Schema, model } = require("mongoose");

const OTPSchema = new Schema({
    loginId: {
        type: String,
        unique: true,
        required: true
    },
    OTP: {
        type: String,
        required: true
    },
    expiredAt: {
        type: Date
    }
});

const OTP = model("OTPs", OTPSchema);

module.exports = OTP;