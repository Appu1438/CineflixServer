const express = require('express')
const app = express()
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const cors = require('cors')
const cookieParser = require('cookie-parser');
const path = require('path')
const authRouter = require('./routes/auth')
const userRouter = require('./routes/users')
const moviesRouter = require('./routes/movies')
const ListRouter = require('./routes/lists')

dotenv.config()
app.use(cookieParser()); // Use cookie-parser middleware
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json({ limit: '10gb' }));
app.use(express.urlencoded({ extended: true, limit: '10gb' }));

app.use(cors({
    origin: (origin, callback) => {
        // Allow all origins by returning the origin in the response
        callback(null, origin || true);
    },
    credentials: true, // Allow credentials to be sent
}));




mongoose.connect(process.env.MONGO_URL).then(() => {
    console.log("Database Connected")
}).catch((e) => {
    console.log(e)
})

app.use(express.json())

app.get("/", (req, res) => {
    res.send({ status: "Started" })
})
app.use('/api/auth', authRouter)
app.use('/api/users', userRouter)
app.use('/api/movies', moviesRouter)
app.use('/api/lists', ListRouter)



app.listen(process.env.PORT, () => {
    console.log(`Server Running in ${process.env.PORT}`);
})
