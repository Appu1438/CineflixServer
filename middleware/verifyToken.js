const jwt = require('jsonwebtoken')

function verify (req, res, next) {
    const authHeader = req.headers.authorization
    if (authHeader) {
        const token = authHeader.split(" ")[1];

        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                res.status(403).json("Token is not valid")
            } else {
                req.user = user
                next()
            }
        })
    } else {
        res.status(401).json('You are not Authenticated')
    }
}


module.exports = verify