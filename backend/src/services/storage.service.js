const {ImageKit} = require('@imagekit/nodejs');

const imagekit = new ImageKit({
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
})
async function uploadFile(file, folder = "complet-backend/music", fileNamePrefix = "file_"){
    const result = await imagekit.files.upload({
        file,
        fileName: fileNamePrefix + Date.now(),
        folder
    })
    return result;
}

module.exports = {uploadFile}