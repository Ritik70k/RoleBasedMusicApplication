require("dotenv").config()
const app = require("./src/app")
const express = require("express")
const connectDB = require("./src/db/db")


connectDB()



app.listen(3000, () => {
    console.log("Server is runing on port 3000")
})