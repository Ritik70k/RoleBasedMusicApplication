const musicModel = require("../models/music.model");
const userModel = require("../models/user.model");
const { uploadFile } = require("../services/storage.service");

async function createMusic(req, res) {
    try {
        const title = req.body.title;
        let musicFile = null;
        let thumbnailFile = null;

        if (req.files) {
            musicFile = req.files['music'] ? req.files['music'][0] : null;
            thumbnailFile = req.files['thumbnail'] ? req.files['thumbnail'][0] : null;
        } else if (req.file) {
            musicFile = req.file;
        }

        if (!musicFile) {
            return res.status(400).json({ message: "Audio file is required" });
        }

        if (!title || !title.trim()) {
            return res.status(400).json({ message: "Song title is required" });
        }

        // Upload audio file to ImageKit
        const musicUploadResult = await uploadFile(
            musicFile.buffer.toString('base64'),
            "complet-backend/music",
            "music_"
        );

        let thumbnailUrl = "";
        if (thumbnailFile) {
            const thumbnailUploadResult = await uploadFile(
                thumbnailFile.buffer.toString('base64'),
                "complet-backend/thumbnails",
                "thumb_"
            );
            thumbnailUrl = thumbnailUploadResult.url;
        }

        const music = await musicModel.create({
            uri: musicUploadResult.url,
            thumbnail: thumbnailUrl,
            title: title.trim(),
            artist: req.user.id
        });

        const populatedMusic = await musicModel.findById(music._id).populate("artist", "username");

        res.status(201).json({
            message: "Music uploaded successfully",
            music: populatedMusic
        });
    } catch (err) {
        console.error("Create music error:", err);
        return res.status(500).json({ message: "Failed to upload music" });
    }
}

// show all musics
async function getAllMusic(req, res) {
    try {
        const musics = await musicModel.find().limit(50).populate("artist", "username");
        res.status(200).json({
            message: "musics fetched successfully",
            musics
        });
    } catch (err) {
        return res.status(500).json({
            message: "Failed to fetch musics",
        });
    }
}

// Toggle favorite song for authenticated user
async function toggleFavorite(req, res) {
    try {
        const musicId = req.params.musicId;
        const userId = req.user.id;

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const favoriteIndex = user.favorites.findIndex(id => id.toString() === musicId);
        let isFavorite = false;

        if (favoriteIndex > -1) {
            user.favorites.splice(favoriteIndex, 1);
            isFavorite = false;
        } else {
            user.favorites.push(musicId);
            isFavorite = true;
        }

        await user.save();

        res.status(200).json({
            message: isFavorite ? "Added to favorites" : "Removed from favorites",
            isFavorite,
            favorites: user.favorites
        });
    } catch (err) {
        return res.status(500).json({ message: "Failed to update favorites" });
    }
}

// Get user favorite songs
async function getFavorites(req, res) {
    try {
        const user = await userModel.findById(req.user.id).populate({
            path: "favorites",
            populate: { path: "artist", select: "username" }
        });

        res.status(200).json({
            message: "Favorites fetched successfully",
            favorites: user ? user.favorites : []
        });
    } catch (err) {
        return res.status(500).json({ message: "Failed to fetch favorites" });
    }
}

// Record recently played song
async function recordRecentlyPlayed(req, res) {
    try {
        const musicId = req.params.musicId;
        const userId = req.user.id;

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Remove existing entry for same song if present
        user.recentlyPlayed = user.recentlyPlayed.filter(
            item => item.music && item.music.toString() !== musicId
        );

        // Prepend new entry
        user.recentlyPlayed.unshift({
            music: musicId,
            playedAt: new Date()
        });

        // Limit to top 15 recently played
        if (user.recentlyPlayed.length > 15) {
            user.recentlyPlayed = user.recentlyPlayed.slice(0, 15);
        }

        await user.save();

        res.status(200).json({ message: "Recorded play" });
    } catch (err) {
        return res.status(500).json({ message: "Failed to record play" });
    }
}

// Get user recently played songs
async function getRecentlyPlayed(req, res) {
    try {
        const user = await userModel.findById(req.user.id).populate({
            path: "recentlyPlayed.music",
            populate: { path: "artist", select: "username" }
        });

        const recentMusics = user && user.recentlyPlayed
            ? user.recentlyPlayed
                .filter(item => item.music)
                .map(item => item.music)
            : [];

        res.status(200).json({
            message: "Recently played fetched successfully",
            recentlyPlayed: recentMusics
        });
    } catch (err) {
        return res.status(500).json({ message: "Failed to fetch recently played" });
    }
}

module.exports = {
    createMusic,
    getAllMusic,
    toggleFavorite,
    getFavorites,
    recordRecentlyPlayed,
    getRecentlyPlayed
};
