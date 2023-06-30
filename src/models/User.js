const validator = require("validator");
const { Schema, model } = require("mongoose");

const userSchema = new Schema({
    firstname: {
        type: String,
        required: true,
    },
    lastname: {
        type: String,
        required: true,
    },
    loginId: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('email is invalid');
            }
        },
    },
    password: {
        type: String,
        trim: true,
        minlength: 6,
        required: true,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('Password should not contain word: password');
            }
        },
    },
    role: {
        type: String,
        default: 'guest',
        enum: ['guest', 'user', 'admin'],
    },
    contactNumber: {
        type: String,
        required: true,
        validate(value) {
            if (!validator.isMobilePhone(value)) {
                throw new Error('Contact Number is invalid');
            }
        },
    }
});

const User = model('User', userSchema);

module.exports = User;