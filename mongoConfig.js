require('dotenv').config()

const mongoose = require('mongoose')

mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true })
const db = mongoose.connection
db.on("error", console.error.bind(console, "Mongo DB connection error"))
