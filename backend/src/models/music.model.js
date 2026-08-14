const mongoose = require("mongoose");

const musicShema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    uri: {
        type: String,
        required: true
    },
    thumbnail: {
        type: String,
        default: ""
    },
    artist: {
        type:mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
  
    }
})

const musicModel = mongoose.model("music", musicShema)

module.exports = musicModel