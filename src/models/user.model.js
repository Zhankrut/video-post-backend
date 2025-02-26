// hey github copilot only suggest comment for me, I will write the code myself
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
// jwt is a bearer token that is used to authenticate the user
// this jwt is used to generate the token for the user
// what are the tokens?
// tokens are used to authenticate the user and to access the resources of the user
import bcrypt from 'bcrypt';
// this bcrypt is used to hash the password of the user

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    avatar: {
        type: String, // cloudinary url 
        required: true,
    },
    coverImage: {
        type: String, // cloudinary url
    },
    watchHistory: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video",
        }
    ],
    password: {
        type: String,
        required: [true, "Password is required"], // we can add a custom message to all required fields
    },
    refreshToken: {
        type: String,
    }



}, { timestamps: true });

// the pre hook in mongoose is used to execute some code before saving the data to the database
// here we are not using arrow function because we want to use the this keyword and arrow function does not have this keyword
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();// if the password is not modified then return next

    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            // this is the payload of the token
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    )
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            // this is the payload of the token
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    )
}

export const User = mongoose.model("User", userSchema);