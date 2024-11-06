const { register, login, refreshToken, get_User, logout, generateOTP, resetPassword } = require('../controllers/authController')
const verify = require('../middleware/verifyToken')
const router = require('express').Router()

router.post("/register", register)

router.post('/login', login)


router.post('/logout', logout)

router.get('/profile', verify, get_User)

router.post('/refresh', refreshToken)

router.post('/generate-otp', generateOTP)

router.post('/reset-password', resetPassword)



module.exports = router