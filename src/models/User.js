const validator = require("validator");
const { Schema, model } = require("mongoose");

const userSchema = new Schema({
    firstname: {
        type: String,
        required: true,
        minlength: 3
    },
    lastname: {
        type: String,
        required: true,
        minlength: 3
    },
    loginId: {
        type: String,
        unique: true,
        required: true,
        minlength: [5, "LoginId should contains 5 characters long"]
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
        minlength: [6, "password should contains 6 characters long"],
        required: true,
        trim: true
    },
    role: {
        type: String,
        default: 'guest',
        enum: ['guest', 'user', 'admin'],
    },
    contactNumber: {
        type: Number,
        required: true,
        validate: {
            validator: (phone) => /\d{10}/.test(phone),
            message: props => `${props.value} is not a valid contact number!`
        }
    }
});

const User = model('User', userSchema);

module.exports = User;