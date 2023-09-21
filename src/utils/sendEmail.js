const nodemailer = require("nodemailer");

const sendEmail = async (otp, receiverMail) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SENDER_MAIL,
            pass: process.env.SENDER_MAILPASS
        }
    });
    try {
        let info = await transporter.sendMail({
            from: `Anonymous Dev <${process.env.SENDER_MAIL}>`,
            to: receiverMail,
            subject: "OTP Verification",
            html: `<h3>Your OTP is <span style="color:red;">${otp}</span>.</h3><h3>Login now, this OTP will expire in <span style="color:red;">5 minutes</span>.</h3>`,
        });
    }
    catch (err) {
        console.log(err);
    }
}

module.exports = sendEmail;