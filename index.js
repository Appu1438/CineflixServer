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
    origin: ['https://cineflixadmin.onrender.com', 'https://cineflix-zbtp.onrender.com','http://localhost:3000', 'http://localhost:4000'], // Specify the allowed origins
    credentials: true, // Allow credentials (cookies, headers, etc.)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed methods
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Custom-Header'], // Allowed headers
}));

app.options('*', (req, res) => {
    res.header("Access-Control-Allow-Origin", req.headers.origin || '*');  // Dynamically set origin
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, X-Custom-Header");
    res.header("Access-Control-Allow-Credentials", "true");
    res.sendStatus(200);  // Send OK response for preflight
});

// Apply CORS headers to all routes, including upload endpoints
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", req.headers.origin || '*');  // Dynamically set origin
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, X-Custom-Header");
    res.header("Access-Control-Allow-Credentials", "true");
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



const port = process.env.PORT || 5000; // Default to port 3000 if not set
app.listen(port, () => {
    console.log(`Server Running on port ${port}`);
});
