const musicModel = require("../models/music.model");
const { uploadFile } = require("../services/storage.service");

async function createMusic(req, res) {
    const file = req.file;
    const { title } = req.body;

    const result = await uploadFile(file.buffer.toString('base64'));

    const music = await musicModel.create({
        uri: result.url,
        title,
        artist: req.user.id
    })

    res.status(201).json({
        message: "Music uploaded successfully",
        music: {
            id: music._id,
            uri: music.uri,
            title: music.title,
            artist: music.artist,
        }
    })

}


//show all musics
async function getAllMusic(req, res) {
    try {
        const musics = await musicModel.find().limit(20).populate("artist", "username");
        res.status(200).json({
            message: "musics fetched successfully",
            musics
        })
    }
    catch (err) {
        return res.status(500).json({
            message: "Failed to fetch musics",
        });
    }
}

module.exports = { createMusic, getAllMusic }
