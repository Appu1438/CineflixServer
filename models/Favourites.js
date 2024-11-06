const mongoose = require('mongoose')

const FavouritesSchema = new mongoose.Schema({
    title: { type: String, default: 'Favourites' },
    userId: { type: String },
    content: { type: Array },
},
    {
        timestamps: true
    }
)

module.exports = mongoose.model("Favourites", FavouritesSchema)