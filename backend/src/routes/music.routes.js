const express = require("express");
const musicController = require("../controllers/music.controller");
const albumController = require("../controllers/album.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const multer = require("multer");

const upload = multer({
    storage: multer.memoryStorage(),
});

const router = express.Router();

router.post('/upload', authMiddleware.authArtist, upload.fields([
    { name: 'music', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
]), musicController.createMusic);

router.post('/album', authMiddleware.authArtist, albumController.createAlbum);

router.get('/', authMiddleware.authUser, musicController.getAllMusic);
router.get('/albums', authMiddleware.authUser, albumController.getAllAlbums);
router.get('/albums/:albumId', authMiddleware.authUser, albumController.getAlbumById);

// Favorites & Recently Played
router.post('/favorite/:musicId', authMiddleware.authUser, musicController.toggleFavorite);
router.get('/favorites', authMiddleware.authUser, musicController.getFavorites);
router.post('/recent/:musicId', authMiddleware.authUser, musicController.recordRecentlyPlayed);
router.get('/recent', authMiddleware.authUser, musicController.getRecentlyPlayed);

module.exports = router;
