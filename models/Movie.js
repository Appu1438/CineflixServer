const mongoose = require('mongoose')

const MovieSchema = new mongoose.Schema({
    title: { type: String, required: true, unique: true },
    desc: { type: String },
    img: { type: String },
    imgTitle: { type: String },
    imgsm: { type: String },
    trailer: { type: String },
    trailerSubtitle: { type: String, default: '' },
    video: { type: String },
    videoSubtitle: { type: String, default: '' },
    year: { type: String },
    duration: { type: String },
    limit: { type: Number },
    genre: { type: Array },
    isSeries: { type: Boolean, default: false },
    favCount: { type: Number, default: 0 },
    ratings: { type: Array },
    average: { type: Number, default: 0 },
    reviewcount: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },


}, {
    timestamps: true
}
)

module.exports = mongoose.model("Movie", MovieSchema)