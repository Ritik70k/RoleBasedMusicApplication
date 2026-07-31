const userModel = require("../models/user.model");
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

//register controller   
async function registerUser(req, res) {
    const { username, email, password, role = "user" } = req.body;

    const isUserAlreadyExist = await userModel.findOne({
        $or: [
            { username: req.body.username },
            { email: req.body.email }
        ]
    })
    if (isUserAlreadyExist) {
        return res.status(409).json({
            message: "User already exist!"
        })
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await userModel.create({
        username,
        email,
        password: hash,
        role
    })

    const token = jwt.sign({
        id: user._id,
        role: user.role
    }, process.env.JWT_SECRET)

    res.cookie("token", token)


    res.status(201).json({
        message: "User created successfully!",

        users: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        }
    })
}



//login controller
async function loginUser(req, res) {
    const { username, email, password } = req.body

    const user = await userModel.findOne({
        $or: [
            { username },
            { email }
        ]
    })
    if (!user) {
        return res.status(401).json({ message: "Invalid Credetials" })
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid Credentials" })
    }

    const token = jwt.sign({
        id: user._id,
        role: user.role
    }, process.env.JWT_SECRET);

    res.cookie("token", token)

    res.status(200).json({
        message: "User logged in successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        }
    })
}

//logout controller
async function logoutUser(req, res) {
    res.clearCookie("token")
    res.status(200).json({ message: "User logged out successfully" })
}

function getCurrentUser(req, res) {
    res.status(200).json({
        user: {
            id: req.user.id,
            role: req.user.role,
        },
    });
}

module.exports = { registerUser, loginUser, logoutUser, getCurrentUser }
