const mongoose = require('mongoose')

const ReviewSchema = new mongoose.Schema({
    userId: { type: String },
    userName: { type: String },
    movieId: { type: String },
    rating: { type: Number },
    review: { type: String },
    
},
    {
        timestamps: true
    }
)

module.exports = mongoose.model("Review", ReviewSchema)