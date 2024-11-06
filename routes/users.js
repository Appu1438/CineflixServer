const { update_user,
    delete_user,
    get_user,
    all_user,
    user_stats,
    add_user_fav,
    remove_user_fav,
    get_user_fav,
    add_movie_to_history,
    remove_movie_from_history,
    get_user_history,
    add_user_watchlater,
    remove_user_watchlater,
    get_user_watchlater, 
    get_user_likes} = require('../controllers/userController')

const verify = require('../middleware/verifyToken')

const router = require('express').Router()

router.get('/find/:id', get_user)

router.get('/stats', user_stats)

router.use(verify)

router.put('/:id', update_user)

router.delete('/:id', delete_user)

router.get('/', all_user)

router.post('/fav/:id', add_user_fav)

router.delete('/fav/:id', remove_user_fav)

router.get('/fav/:id', get_user_fav)

router.post('/watch/:id', add_user_watchlater)

router.delete('/watch/:id', remove_user_watchlater)

router.get('/watch/:id', get_user_watchlater)

router.post('/history/:id', add_movie_to_history)

router.delete('/history/:id', remove_movie_from_history)

router.get('/history/:id', get_user_history)

router.get('/likes/:id', get_user_likes)

module.exports = router