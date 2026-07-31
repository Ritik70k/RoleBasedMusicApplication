const express = require("express");
const musicController = require("../controllers/music.controller");
const albumController = require("../controllers/album.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const multer = require("multer");


const upload = multer({
    storage:multer.memoryStorage(),
})
const router = express.Router();

router.post('/upload', authMiddleware.authArtist, upload.single('music'), musicController.createMusic)
router.post('/album', authMiddleware.authArtist ,albumController.createAlbum)

router.get('/', authMiddleware.authUser, musicController.getAllMusic)
router.get('/albums', authMiddleware.authUser, albumController.getAllAlbums)
router.get('/albums/:albumId', authMiddleware.authUser, albumController.getAlbumById)


module.exports = router
