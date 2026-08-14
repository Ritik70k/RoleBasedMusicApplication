const userModel = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const isProduction = process.env.NODE_ENV === "production" || (process.env.FRONTEND_URL && process.env.FRONTEND_URL.startsWith("https"));

const getCookieOptions = () => ({
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
});

//register controller   
async function registerUser(req, res) {
    const { username, email, password, role = "user" } = req.body;

    const isUserAlreadyExist = await userModel.findOne({
        $or: [
            { username: req.body.username },
            { email: req.body.email }
        ]
    });
    if (isUserAlreadyExist) {
        return res.status(409).json({
            message: "User already exist!"
        });
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await userModel.create({
        username,
        email,
        password: hash,
        role
    });

    const token = jwt.sign({
        id: user._id,
        role: user.role
    }, process.env.JWT_SECRET);

    res.cookie("token", token, getCookieOptions());

    res.status(201).json({
        message: "User created successfully!",
        users: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        }
    });
}

//login controller
async function loginUser(req, res) {
    const { username, email, password } = req.body;

    const user = await userModel.findOne({
        $or: [
            { username },
            { email }
        ]
    });
    if (!user) {
        return res.status(401).json({ message: "Invalid Credentials" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid Credentials" });
    }

    const token = jwt.sign({
        id: user._id,
        role: user.role
    }, process.env.JWT_SECRET);

    res.cookie("token", token, getCookieOptions());

    res.status(200).json({
        message: "User logged in successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        }
    });
}

//logout controller
async function logoutUser(req, res) {
    res.clearCookie("token", getCookieOptions());
    res.status(200).json({ message: "User logged out successfully" });
}

async function getCurrentUser(req, res) {
    try {
        const user = await userModel.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }
        res.status(200).json({
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                favorites: user.favorites || []
            },
        });
    } catch (err) {
        res.status(200).json({
            user: {
                id: req.user.id,
                role: req.user.role,
            },
        });
    }
}

module.exports = { registerUser, loginUser, logoutUser, getCurrentUser };
