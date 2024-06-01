const mongoose = require('mongoose')
require('dotenv').config()

const connectDB = () => {
    mongoose.connect(process.env.MONGODB_URI, {
        // useNewUrlParser: true,
        // useUnifiedTopology: true,
    }).then((data) => {
        console.log(`MongoDB Connect with Server: ${data.connection.host}`);
    }).catch((err) => {
        console.log(err);
    })
}

module.exports = connectDB

