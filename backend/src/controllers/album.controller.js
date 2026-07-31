const albumModel = require("../models/album.model");

async function createAlbum(req, res) {

    const {title, musics} = req.body

    const album = await albumModel.create({
        title,
        musics:musics,
        artist:req.user.id
    })

    res.status(201).json({
        message:"Album created successfully",
        album:{
            id:album._id,
            title:album.title,
            artist:album.artist,
            musics:album.musics
        }
    })
}


//show all albums
async function getAllAlbums(req, res) {
    try {
        const albums = await albumModel.find().select("title artist").populate("artist", "username");
        res.status(200).json({
            message: "Albums fetched successfully",
            albums
        })
    }
    catch (err) {
        return res.status(500).json({
            message: "Failed to fetch musics",
        });
    }
}

async function getAlbumById(req, res) {
    const albumId = req.params.albumId
    try {
        const album = await albumModel.findById(albumId).populate("artist", "username").populate("musics");
        res.status(200).json({
            message: "Album fetched successfully",
            album
        })
    }
    catch (err) {
        return res.status(500).json({
            message: "Failed to fetch musics",
        });
    }
}

module.exports = {createAlbum, getAllAlbums, getAlbumById}
