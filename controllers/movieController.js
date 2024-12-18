const Movie = require('../models/Movie')
const Review = require('../models/Reviews')
const List = require('../models/List')
const Likes = require('../models/Likes')
const Dislikes = require('../models/Dislikes')
const multer = require('multer');
const path = require('path');
const fs = require('fs')
const ffmpeg = require('fluent-ffmpeg')

const mongoose = require('mongoose');
const { storage, upload } = require('../utils/storage')
const History = require('../models/History')
const WebMWriter  = require('webm-writer'); // For WebM streaming


// Manually set the FFmpeg path
// ffmpeg.setFfmpegPath('C:\\ffmpeg\\bin\\ffmpeg.exe');
// ffmpeg.setFfprobePath('C:\\ffmpeg\\bin\\ffprobe.exe');

// ffmpeg.setFfmpegPath('/usr/bin/ffmpeg');


// Test if FFmpeg works
ffmpeg.getAvailableFormats((err, formats) => {
    if (err) {
        console.error('Error:', err.message);
    } else {
        console.log('FFMPEG Available');
    }
});

const add_movie = async (req, res) => {
    if (req.user.isAdmin) {
        const newMovie = new Movie(req.body)
        try {
            const savedMovie = await newMovie.save()
            res.status(200).json(savedMovie)

        } catch (error) {
            res.status(500).json(error)

        }

    } else {
        res.status(403).json("You are not allowded")

    }
}


// Video upload controller

const upload_video = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send({ message: 'No video file uploaded.' });
        }
        const originalVideoPath = path.join(__dirname, '..', 'public', 'assets', 'videos', req.file.filename);
        console.log(`Original video uploaded to: ${originalVideoPath}`);

        res.status(200).send({
            message: 'Video uploaded successfully!',
            videoUrl: req.file.filename, // Save filename for reference in streaming
        });
    } catch (error) {
        console.error('Error uploading video:', error);
        res.status(500).send({ message: 'Error uploading video.', error });
    }
};


const stream_video = async (req, res) => {
    const filename = req.query.filename;
    const quality = req.query.quality || "720p"; // Default to 720p if not specified

    console.log(`Requested video: ${filename}, Quality: ${quality}`);

    const originalVideoPath = path.join(__dirname, '..', 'public', 'assets', 'videos', filename);
    console.log(originalVideoPath);

    try {
        if (!fs.existsSync(originalVideoPath) || !fs.statSync(originalVideoPath).isFile()) {
            console.log(`Original video not found`);
            return res.status(404).send({ message: 'Video file not found.' });
        }

        const range = req.headers.range;
        const stat = fs.statSync(originalVideoPath);
        const fileSize = stat.size;

        if (range) {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunkSize = (end - start) + 1;

            const fileStream = fs.createReadStream(originalVideoPath, { start, end });

            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize,
                'Content-Type': 'video/mp4',
            });

            fileStream.pipe(res);

            fileStream.on('error', (err) => {
                console.error('Error during normal streaming:', err);
                res.status(500).send({ message: 'Error during normal streaming.', error: err.message });
            });

        } else {
            res.writeHead(200, { 'Content-Type': 'video/mp4', 'Content-Length': fileSize });

            const fileStream = fs.createReadStream(originalVideoPath);
            fileStream.pipe(res);

            fileStream.on('error', (err) => {
                console.error('Error during normal streaming:', err);
                res.status(500).send({ message: 'Error during normal streaming.', error: err.message });
            });
        }
    } catch (error) {
        console.error('Error streaming video:', error);

        if (!res.headersSent) {
            res.status(500).send({ message: 'Error streaming video', error: error.message });
        }
    }
};



const update_movie = async (req, res) => {
    if (req.user.isAdmin) {
        try {
            const updatedMovie = await Movie.findByIdAndUpdate(req.params.id, {
                $set: req.body
            }, { new: true })
            res.status(200).json(updatedMovie)

        } catch (error) {
            res.status(500).json(error)

        }

    } else {
        res.status(403).json("You are not allowded")

    }
}

const delete_movie = async (req, res) => {
    if (req.user.isAdmin) {
        try {
            const deletedMovie = await Movie.findByIdAndDelete(req.params.id)
            await List.updateMany(
                { content: req.params.id },    // Find all lists that contain the movie ID in their content array
                { $pull: { content: req.params.id } } // Remove the movie ID from the content array
            );

            res.status(200).json(deletedMovie)
        } catch (error) {
            res.status(500).json(error)
        }
    } else {
        res.status(403).json("You are not allowded ")

    }
}

const get_movie = async (req, res) => {
    // console.log(req.params.id)
    try {
        const movie = await Movie.findById(req.params.id)
        res.status(200).json(movie)
    } catch (error) {
        res.status(500).json(error)
    }
}

const get_random_movie = async (req, res) => {
    const type = req.query.type
    let movie;
    try {
        if (type == 'series') {
            movie = await Movie.aggregate([
                { $match: { isSeries: true } },
                { $sample: { size: 5 } }
            ])
        } else if (type == 'movie') {
            movie = await Movie.aggregate([
                { $match: { isSeries: false } },
                { $sample: { size: 5 } }
            ])
        } else {
            movie = await Movie.aggregate([
                { $sample: { size: 5 } }
            ])
        }
        res.status(200).json(movie)
    } catch (error) {
        res.status(500).json(error)
    }
}
const get_related_movie = async (req, res) => {
    const genre = req.params.genre.split(','); // Get genres from params and split into an array
    const movieId = req.query.movieId; // Extract movieId from the query parameters
    let movies;
    // console.log(genre, movieId)

    try {
        // Convert movieId to ObjectId
        const movieObjectId = new mongoose.Types.ObjectId(movieId);

        // Fetch movies that match any of the genres in the array, excluding the current movie
        movies = await Movie.aggregate([
            {
                $match: {
                    genre: { $in: genre },
                    _id: { $ne: movieObjectId } // Exclude the current movie
                }
            },
            { $sample: { size: 10 } } // Randomly select 10 movies
        ]);


        res.status(200).json(movies);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching related movies', error: error.message });
    }
};

const searchMovies = async (req, res) => {
    const { text } = req.query; // Extract search parameter from query
    const userId = req.user.id; // Get the user ID from the authenticated request


    let query = {}; // Base query object to build dynamic search conditions

    // If the text is provided, search across multiple fields: title, genre, or rating
    if (text) {
        // Check if text is a number for rating search
        const ratingValue = parseFloat(text);

        query = {
            $or: [
                { title: { $regex: new RegExp(text, 'i') } }, // Search by title (case-insensitive)
                { genre: { $regex: new RegExp(text, 'i') } }, // Search by genre (case-insensitive)
                // If text is a number, consider it as a potential rating
                ...(isNaN(ratingValue) ? [] : [{ average: ratingValue }])
            ]
        };
    }

    try {

        const movies = await Movie.find(query); // Fetch movies based on query
        const existingHistory = await History.findOne({ userId });

        if (existingHistory) {
            // Check if the search text is already in the content array
            const alreadyExists = existingHistory.search.find(item => item === text);

            if (!alreadyExists) {
                // If the text is not already in the array, add it
                existingHistory.search.push(text);
                await existingHistory.save(); // Save the updated history
            }
        } else {
            // If no record exists, create a new one
            await History.create({
                userId: userId,
                search: [text]
            });
        }
        res.status(200).json(movies);
    } catch (error) {
        res.status(500).json({ message: 'Error searching for movies', error: error.message });
    }
};



const get_all_movie = async (req, res) => {
    if (req.user.isAdmin) {
        try {
            const movies = await Movie.find()
            res.status(200).json(movies.reverse())

        } catch (error) {
            res.status(500).json(error)
        }

    } else {
        res.status(403).json("You are not allowded ")

    }
}
const add_review = async (req, res) => {
    const movieId = req.params.id;
    const { userId, userName, rating, review } = req.body;

    if (req.user.id === userId || req.user.isAdmin) {
        try {
            // Check if the user already reviewed this movie
            const existingReview = await Review.findOne({ movieId, userId });

            if (existingReview) {
                // If a review exists, update it
                const oldRating = existingReview.rating
                existingReview.rating = rating;
                existingReview.review = review;

                // Save the updated review
                const updatedReview = await existingReview.save();

                // Update the movie's ratings and review count
                const movie = await Movie.findById(movieId);
                if (!movie) {
                    return res.status(404).json({ message: 'Movie not found.' });
                }

                // Find and update the user's rating in the movie's ratings array
                const userRatingIndex = movie.ratings.findIndex(r => r === oldRating);
                if (userRatingIndex !== -1) {
                    movie.ratings[userRatingIndex] = rating;
                } else {
                    movie.ratings.push(rating);
                }

                // Recalculate review count and average rating
                movie.reviewcount = movie.reviewcount || movie.ratings.length;
                const totalRating = movie.ratings.reduce((acc, rate) => acc + rate, 0);
                movie.average = totalRating / movie.ratings.length;

                // Save the updated movie
                await movie.save();

                res.status(200).json({
                    message: 'Review updated successfully and movie updated.',
                    review: updatedReview,
                    movie
                });

            } else {
                // If no existing review, create a new one
                const newReview = new Review({
                    userId,
                    userName,
                    movieId,
                    rating,
                    review
                });

                // Save the new review
                const savedReview = await newReview.save();

                // Find the movie and update its ratings and review count
                const movie = await Movie.findById(movieId);
                if (!movie) {
                    return res.status(404).json({ message: 'Movie not found.' });
                }

                // Push the new rating to the movie's ratings array
                movie.ratings.push(rating);

                // Update review count and recalculate average rating
                movie.reviewcount = (movie.reviewcount || 0) + 1;
                const totalRating = movie.ratings.reduce((acc, rate) => acc + rate, 0);
                movie.average = totalRating / movie.ratings.length;

                // Save the updated movie document
                await movie.save();

                res.status(201).json({
                    message: 'Review added successfully and movie updated.',
                    review: savedReview,
                    movie
                });
            }
        } catch (error) {
            console.error('Error adding or updating review:', error);
            res.status(500).json({ message: 'Error adding or updating review.', error });
        }
    } else {
        res.status(403).json("You are not allowed to add a review for this user.");
    }
};


const delete_review = async (req, res) => {
    const id = req.query.reviewId; // Extract the review ID from the request body
    console.log(`Received request to delete review with ID: ${id}`);

    try {
        // Find the review by ID
        const review = await Review.findById(id);
        if (!review) {
            console.log(`Review with ID: ${id} not found.`);
            return res.status(404).json({ message: 'Review not found.' });
        }

        // Check if the user who submitted the review is the one making the request
        if (req.user.id == review.userId || req.user.isAdmin) {
            // Delete the review
            await Review.deleteOne({ _id: id });
            console.log(`Review with ID: ${id} deleted successfully.`);

            // Find the associated movie
            const movie = await Movie.findById(review.movieId);
            if (!movie) {
                console.log('movie not found')
                return res.status(404).json({ message: 'Movie not found.' });
            }

            // Remove the rating from the ratings array
            movie.ratings = movie.ratings.filter(r => r !== review.rating);

            // Update reviewCount
            movie.reviewcount = Math.max((movie.reviewcount || 0) - 1, 0);

            // Recalculate average rating
            if (Array.isArray(movie.ratings) && movie.ratings.length > 0) {
                const totalRating = movie.ratings.reduce((acc, rate) => acc + rate, 0);
                movie.average = totalRating / movie.ratings.length;
            } else {
                movie.average = 0;  // Handle case where ratings array is empty or invalid
            }

            console.log(movie.average);
            // Save the updated movie document
            await movie.save();

            res.status(200).json({ message: 'Review deleted successfully and movie updated.' });
        } else {
            console.log(`User ID: ${req.user.id} is not allowed to delete review with ID: ${id}.`);
            res.status(403).json({ message: 'You are not allowed to delete this review.' });
        }
    } catch (error) {
        console.error(`Error deleting review with ID: ${id}:`, error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};
const get_reviews_by_movieId = async (req, res) => {
    const movieId = req.params.id; // Extract movieId from request parameters
    console.log(movieId)
    try {
        // Find all reviews with the given movieId
        const reviews = await Review.find({ movieId });
        res.status(200).json(reviews?.reverse());
    } catch (error) {
        res.status(500).json(error);
    }
};


// Like a movie
const like_movie = async (req, res) => {
    const userId = req.params.id;
    const movieId = req.body.movieId;

    try {
        // Find or create the user's likes collection
        let likeCollection = await Likes.findOne({ userId });
        if (!likeCollection) {
            likeCollection = new Likes({ userId, content: [] });
        }

        // Check if the movie is already liked
        const isLiked = likeCollection.content.includes(movieId);

        if (isLiked) {
            // Remove the movie from the likes collection (unlike)
            likeCollection.content = likeCollection.content.filter(id => id !== movieId);
            await likeCollection.save();

            // Decrement the likes in the movie collection
            await Movie.findByIdAndUpdate(movieId, { $inc: { likes: -1 } });
            const [updatedLikesCollection, updatedDislikesCollection] = await Promise.all([
                Likes.findOne({ userId }),
                Dislikes.findOne({ userId })
            ]);

            // Send the updated collections to the frontend
            res.status(200).json({
                likes: updatedLikesCollection,
                dislikes: updatedDislikesCollection
            });
        } else {
            // Add movie to the likes collection (like)
            likeCollection.content.push(movieId);
            await likeCollection.save();

            // Increment the likes in the movie collection
            await Movie.findByIdAndUpdate(movieId, { $inc: { likes: 1 } });

            // If the movie is in the dislikes collection, remove it and decrement dislikes
            let dislikeCollection = await Dislikes.findOne({ userId });
            if (dislikeCollection && dislikeCollection.content.includes(movieId)) {
                dislikeCollection.content = dislikeCollection.content.filter(id => id !== movieId);
                await dislikeCollection.save();

                // Decrement dislikes in the movie collection
                await Movie.findByIdAndUpdate(movieId, { $inc: { dislikes: -1 } });
            }

            const [updatedLikesCollection, updatedDislikesCollection] = await Promise.all([
                Likes.findOne({ userId }),
                Dislikes.findOne({ userId })
            ]);
            // Send the updated collections to the frontend
            res.status(200).json({
                likes: updatedLikesCollection,
                dislikes: updatedDislikesCollection
            });
        }
    } catch (error) {
        res.status(500).json(error);
    }
};

// Dislike a movie
const dislike_movie = async (req, res) => {
    console.log(req.query)
    const userId = req.params.id;
    const movieId = req.query.movieId;

    try {
        // Find or create the user's dislikes collection
        let dislikeCollection = await Dislikes.findOne({ userId });
        if (!dislikeCollection) {
            dislikeCollection = new Dislikes({ userId, content: [] });
        }

        // Check if the movie is already disliked
        const isDisliked = dislikeCollection.content.includes(movieId);

        if (isDisliked) {
            // Remove the movie from the dislikes collection (undislike)
            dislikeCollection.content = dislikeCollection.content.filter(id => id !== movieId);
            await dislikeCollection.save();

            // Decrement the dislikes in the movie collection
            await Movie.findByIdAndUpdate(movieId, { $inc: { dislikes: -1 } });

            const [updatedLikesCollection, updatedDislikesCollection] = await Promise.all([
                Likes.findOne({ userId }),
                Dislikes.findOne({ userId })
            ]);

            // Send the updated collections to the frontend
            res.status(200).json({
                likes: updatedLikesCollection,
                dislikes: updatedDislikesCollection
            });
        } else {
            // Add movie to the dislikes collection (dislike)
            dislikeCollection.content.push(movieId);
            await dislikeCollection.save();

            // Increment the dislikes in the movie collection
            await Movie.findByIdAndUpdate(movieId, { $inc: { dislikes: 1 } });

            // If the movie is in the likes collection, remove it and decrement likes
            let likeCollection = await Likes.findOne({ userId });
            if (likeCollection && likeCollection.content.includes(movieId)) {
                likeCollection.content = likeCollection.content.filter(id => id !== movieId);
                await likeCollection.save();

                // Decrement likes in the movie collection
                await Movie.findByIdAndUpdate(movieId, { $inc: { likes: -1 } });
            }

            const [updatedLikesCollection, updatedDislikesCollection] = await Promise.all([
                Likes.findOne({ userId }),
                Dislikes.findOne({ userId })
            ]);

            // Send the updated collections to the frontend
            res.status(200).json({
                likes: updatedLikesCollection,
                dislikes: updatedDislikesCollection
            });
        }
    } catch (error) {
        res.status(500).json(error);
    }
};



module.exports = {
    add_movie,
    update_movie,
    delete_movie,
    get_movie,
    get_random_movie,
    get_all_movie,
    add_review,
    delete_review,
    get_reviews_by_movieId,
    like_movie,
    dislike_movie,
    get_related_movie,
    upload_video,
    stream_video,
    searchMovies
}

