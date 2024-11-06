const mongoose = require('mongoose')

const WatchLaterSchema = new mongoose.Schema({
    title: { type: String, default: 'Watch Later' },
    userId: { type: String },
    content: { type: Array },
},
    {
        timestamps: true
    }
)

module.exports = mongoose.model("WatchLater", WatchLaterSchema)