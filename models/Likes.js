const mongoose = require('mongoose')

const LikesSchema = new mongoose.Schema({
    title: { type: String, default: 'Liked Videos' },
    userId: { type: String },
    content: { type: Array },
},
    {
        timestamps: true
    }
)

module.exports = mongoose.model("Likes", LikesSchema)