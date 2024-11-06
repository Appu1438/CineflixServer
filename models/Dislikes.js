const mongoose = require('mongoose')

const DislikesSchema = new mongoose.Schema({
    title: { type: String, default: 'Disliked Videos' },
    userId: { type: String },
    content: { type: Array },
},
    {
        timestamps: true
    }
)

module.exports = mongoose.model("Dislikes", DislikesSchema)