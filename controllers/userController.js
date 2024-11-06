const User = require('../models/User')
const Movie = require('../models/Movie')
const Favourites = require('../models/Favourites')
const History = require('../models/History')
const Likes = require('../models/Likes')
const Dislikes = require('../models/Dislikes')
const WatchLater = require('../models/WatchLater')
const bcrypt = require('bcryptjs');

const update_user = async (req, res) => {
    console.log(req.body)
    if (req.user.id == req.params.id || req.user.isAdmin) {

        if (req.body.password) {
            req.body.password = await bcrypt.hash(req.body.password, 10)
        }

        try {
            const updatedUser = await User.findByIdAndUpdate(req.params.id,
                {
                    $set: req.body
                },
                {
                    new: true
                }
            )
            const { password: pwd, ...info } = updatedUser._doc;

            res.status(200).json(info)

        } catch (error) {
            res.status(500).json(error)
        }

    } else {
        res.status(403).json("You can update your account only")

    }
}

const delete_user = async (req, res) => {
    if (req.user.id == req.params.id || req.user.isAdmin) {

        try {
            await User.findByIdAndDelete(req.params.id)
            res.status(200).json("User has been Deleted")

        } catch (error) {
            res.status(500).json(error)
        }

    } else {
        res.status(403).json("You can delete your account only")

    }
}

const get_user = async (req, res) => {

    try {
        const user = await User.findById(req.params.id)
        const { password, ...info } = user._doc
        res.status(200).json(info)

    } catch (error) {
        res.status(500).json(error)
    }
}

const all_user = async (req, res) => {
    const query = req.query.new
    if (req.user.isAdmin) {
        try {
            const users = query ? await User.find().sort({ _id: -1 }).limit(10)
                : await User.find()
            res.status(200).json(users)
        } catch (error) {
            res.status(500).json(error)
        }

    } else {
        res.status(403).json("You are not allowded")

    }
}

const user_stats = async (req, res) => {
    const today = new Date();
    const lastYear = today.setFullYear(today.setFullYear() - 1)

    const monthsArray =
        [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];

    try {
        const data = await User.aggregate([
            {
                $project: {
                    month: { $month: "$createdAt" }
                }
            },
            {
                $group: {
                    _id: "$month",
                    total: { $sum: 1 }
                }

            }]);
        res.status(200).json(data)
    } catch (error) {
        res.status(500).json(error)
    }
}

const add_user_fav = async (req, res) => {
    const userId = req.params.id;
    const movieId = req.body.movieId;

    if (req.user.id == userId || req.user.isAdmin) {

        if (!movieId) {
            return res.status(404).json("Movie ID Nor Found")
        }
        try {
            // Find the favorite collection for the user
            let favCollection = await Favourites.findOne({ userId });

            if (favCollection) {
                // Check if the movie ID already exists in the content array
                if (favCollection.content.includes(movieId)) {
                    return res.status(400).json("Movie already exists in favorites");
                } else {
                    // Add the movie ID to the content array
                    favCollection.content.push(movieId);
                    await favCollection.save();

                    // Increment the favCount for the movie
                    await Movie.findByIdAndUpdate(movieId, { $inc: { favCount: 1 } });
                }
            } else {
                // Create a new favorite collection for the user
                favCollection = new Favourites({
                    userId,
                    content: [movieId]
                });
                await favCollection.save();

                // Increment the favCount for the movie
                await Movie.findByIdAndUpdate(movieId, { $inc: { favCount: 1 } });
            }

            res.status(200).json(favCollection);
        } catch (error) {
            res.status(500).json(error);
        }
    } else {
        res.status(403).json("You can update your account only");
    }
};

const remove_user_fav = async (req, res) => {
    const userId = req.params.id;
    const movieId = req.query.movieId;

    if (req.user.id == userId || req.user.isAdmin) {
        try {
            // Find the favorite collection for the user
            let favCollection = await Favourites.findOne({ userId });

            if (favCollection) {
                // Check if the movie ID exists in the content array
                const movieIndex = favCollection.content.indexOf(movieId);
                if (movieIndex === -1) {
                    return res.status(400).json("Movie does not exist in favorites");
                }

                // Remove the movie ID from the content array
                favCollection.content.splice(movieIndex, 1);
                await favCollection.save();

                // Decrement the favCount for the movie
                await Movie.findByIdAndUpdate(movieId, { $inc: { favCount: -1 } });

                res.status(200).json(favCollection);
            } else {
                return res.status(400).json("Favorites collection not found");
            }
        } catch (error) {
            res.status(500).json(error);
        }
    } else {
        res.status(403).json("You can update your account only");
    }
};
const get_user_fav = async (req, res) => {
    const userId = req.params.id;
    if (req.user.id == userId || req.user.isAdmin) {


        try {
            // Find the favorite collection for the user
            let favCollection = await Favourites.findOne({ userId });

            if (favCollection) {
                res.status(200).json(favCollection);
            } else {
                res.status(400).json("Favorites collection not found");
            }
        } catch (error) {
            res.status(500).json(error);
        }
    } else {
        res.status(403).json("You can get your fav only")
    }
};

const add_user_watchlater = async (req, res) => {

    const userId = req.params.id;
    const movieId = req.body.movieId;

    if (req.user.id == userId || req.user.isAdmin) {
        if (!movieId) {
            return res.status(404).json("Movie ID Nor Found")
        }

        try {

            let WatchLaterCollection = await WatchLater.findOne({ userId });

            if (WatchLaterCollection) {
                // Check if the movie ID already exists in the content array
                if (WatchLaterCollection.content.includes(movieId)) {
                    return res.status(400).json("Movie already exists in WatchLater");
                }
                else {
                    // Add the movie ID to the content array
                    WatchLaterCollection.content.push(movieId);
                    await WatchLaterCollection.save();
                }
            } else {
                // Create a new favorite collection for the user
                WatchLaterCollection = new WatchLater({
                    userId,
                    content: [movieId]
                });
                await WatchLaterCollection.save();
            }

            res.status(200).json(WatchLaterCollection);

        } catch (error) {
            res.status(500).json(error);
        }
    } else {
        res.status(403).json("You can update your account only")

    }
}

const remove_user_watchlater = async (req, res) => {
    console.log(req.query);
    const userId = req.params.id;
    const movieId = req.query.movieId;

    if (req.user.id == userId || req.user.isAdmin) {


        try {
            // Find the favorite collection for the user
            let WatchLaterCollection = await WatchLater.findOne({ userId });

            if (WatchLaterCollection) {
                // Check if the movie ID exists in the content array
                const movieIndex = WatchLaterCollection.content.indexOf(movieId);
                if (movieIndex === -1) {
                    return res.status(400).json("Movie does not exist in WatchLater");
                }

                // Remove the movie ID from the content array
                WatchLaterCollection.content.splice(movieIndex, 1);
                await WatchLaterCollection.save();

                res.status(200).json(WatchLaterCollection);
            } else {
                return res.status(400).json("WatchLaterCollection collection not found");
            }
        } catch (error) {
            res.status(500).json(error);
        }
    } else {
        res.status(403).json("You can update your account only")

    }
};

const get_user_watchlater = async (req, res) => {
    const userId = req.params.id;
    if (req.user.id == userId || req.user.isAdmin) {


        try {
            // Find the favorite collection for the user
            let WatchLaterCollection = await WatchLater.findOne({ userId });

            if (WatchLaterCollection) {
                res.status(200).json(WatchLaterCollection);
            } else {
                res.status(400).json("WatchLaterCollection collection not found");
            }
        } catch (error) {
            res.status(500).json(error);
        }
    } else {
        res.status(403).json("You can get your WatchLaterCollection only")
    }
};

const add_movie_to_history = async (req, res) => {
    const userId = req.params.id;
    const movieId = req.body.movieId;
    const watchedPosition = req.body.watchedPosition;
    // console.log(movieId, watchedPosition)

    if (req.user.id == userId || req.user.isAdmin) {

        if (!movieId) {
            return res.status(404).json("Movie ID Nor Found")
        }

        try {
            // Find the user's history document
            let userHistory = await History.findOne({ userId });

            if (!userHistory) {
                // If the user doesn't have a history document, create one
                userHistory = new History({
                    userId,
                    content: [{ movieId, watchedPosition }]
                });
            } else {
                const movieIndex = userHistory.content.findIndex(item => item.movieId === movieId);

                if (movieIndex !== -1) {
                    // If the movie is already in the history, update its watched position
                    userHistory.content[movieIndex].watchedPosition = watchedPosition;

                    // Remove the existing entry from its current position
                    userHistory.content.splice(movieIndex, 1);
                }
                // Add the movie to the front of the list
                userHistory.content.unshift({ movieId, watchedPosition });
            }

            // Save the user's history document
            await userHistory.save();

            res.status(200).json(userHistory);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    } else {
        res.status(403).json("You can update your account only")

    }
}


const remove_movie_from_history = async (req, res) => {
    console.log(req.body);
    const userId = req.params.id;
    const movieId = req.body.movieId;

    if (req.user.id == userId || req.user.isAdmin) {


        try {
            // Find the favorite collection for the user
            let historyCollection = await History.findOne({ userId });

            if (historyCollection) {
                // Check if the movie ID exists in the content array
                const movieIndex = historyCollection.content.indexOf(movieId);
                if (movieIndex === -1) {
                    return res.status(400).json("Movie does not exist in favorites");
                }

                // Remove the movie ID from the content array
                historyCollection.content.splice(movieIndex, 1);
                await historyCollection.save();

                res.status(200).json(historyCollection);
            } else {
                return res.status(400).json("History was not found");
            }
        } catch (error) {
            res.status(500).json(error);
        }
    } else {
        res.status(403).json("You can update your account only")

    }
};

const get_user_history = async (req, res) => {
    const userId = req.params.id;
    if (req.user.id == userId || req.user.isAdmin) {


        try {
            // Find the favorite collection for the user
            let historyCollection = await History.findOne({ userId });

            if (historyCollection) {
                res.status(200).json(historyCollection);
            } else {
                return res.status(400).json("History was not found");
            }
        } catch (error) {
            res.status(500).json(error);
        }
    } else {
        res.status(403).json("You can get your history only")

    }
};

const get_user_likes = async (req, res) => {
    const userId = req.params.id;

    try {
        // Fetch the likes and dislikes collections in parallel using Promise.all
        const [likesCollection, dislikesCollection] = await Promise.all([
            Likes.findOne({ userId }),
            Dislikes.findOne({ userId })
        ]);

        // Check if neither collection exists
        if (!likesCollection && !dislikesCollection) {
            return res.status(404).json("Likes and Dislikes collections not found");
        }

        // Respond with both collections
        res.status(200).json({
            likes: likesCollection ? likesCollection : {},
            dislikes: dislikesCollection ? dislikesCollection : {}
        });
    } catch (error) {
        res.status(500).json(error);
    }

}

module.exports = {
    update_user,
    delete_user,
    get_user,
    all_user,
    user_stats,
    add_user_fav,
    remove_user_fav,
    get_user_fav,
    add_user_watchlater,
    remove_user_watchlater,
    get_user_watchlater,
    add_movie_to_history,
    remove_movie_from_history,
    get_user_history,
    get_user_likes
}