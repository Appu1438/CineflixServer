const mongoose = require('mongoose');

const HistorySchema = new mongoose.Schema({
    title: { type: String, default: 'History' },
    userId: { type: String, required: true }, // User ID to associate history with a user
    content: [
        {
            movieId: { type: String }, // Reference to the Movie model
            watchedPosition: { type: Number } // Position (in seconds) that the user has watched
        }
    ],
    search: { type: Array }

},
    {
        timestamps: true // Automatically manage createdAt and updatedAt fields
    });

module.exports = mongoose.model("History", HistorySchema);
