const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        unique:true,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    role:{
        type:String,
        enum:["user","artist"],
        default:"user"
    },
    favorites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "music"
    }],
    recentlyPlayed: [{
        music: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "music"
        },
        playedAt: {
            type: Date,
            default: Date.now
        }
    }]
})

const userModel = mongoose.model("user", userSchema)

module.exports = userModel