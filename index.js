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

// CORS setup to handle long file uploads and credentials
app.use(cors({
    origin: (origin, callback) => {
        // Dynamically set origin for requests that need credentials
        callback(null, origin || true); // Allow all origins dynamically
    },
    credentials: true, // Allow credentials to be sent
}));

// Handle preflight OPTIONS request for CORS (important for file uploads)
app.options('*', (req, res) => {
    res.header("Access-Control-Allow-Origin", req.headers.origin || '*');  // Allow dynamic origin
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Credentials", "true");
    res.sendStatus(200);  // Send OK response for preflight
});

// Apply CORS headers to all routes, including upload endpoints
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", req.headers.origin || '*');  // Dynamically set origin
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Credentials", "true");
    next();
});

app.use((req, res, next) => {
    res.setTimeout(60000000);  // Timeout in 10 minutes
    next();
});

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
