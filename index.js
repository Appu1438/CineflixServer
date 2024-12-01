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
    origin: '*', // Allow all origins
    credentials: true, // Allow cookies and authorization headers
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Custom-Header'], // Allowed headers
}));


// Handle preflight OPTIONS request for CORS (important for custom headers)
// Handle preflight OPTIONS request for CORS (important for custom headers)
app.options('*', (req, res) => {
    const origin = req.headers.origin;

    // If credentials are included, we should not use the wildcard '*'
    if (req.headers['access-control-allow-credentials'] === 'true') {
        // Block wildcard usage for credentials requests
        if (origin) {
            res.header("Access-Control-Allow-Origin", origin);  // Dynamically set the origin
        } else {
            res.header("Access-Control-Allow-Origin", '');  // Block if no origin is provided
        }
    } else {
        res.header("Access-Control-Allow-Origin", '*');  // Allow all origins if no credentials
    }

    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, X-Custom-Header");
    res.sendStatus(200);  // Send OK response for preflight
});

// Apply CORS headers to all routes, including upload endpoints
app.use((req, res, next) => {
    const origin = req.headers.origin;

    // If credentials are included, we should not use the wildcard '*'
    if (req.headers['access-control-allow-credentials'] === 'true') {
        if (origin) {
            res.header("Access-Control-Allow-Origin", origin);  // Dynamically set the origin
        } else {
            res.header("Access-Control-Allow-Origin", '');  // Block access if no origin is provided
        }
    } else {
        res.header("Access-Control-Allow-Origin", '*');  // Allow all origins if no credentials
    }

    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, X-Custom-Header");
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
