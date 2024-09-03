// imports
const config = require('./utils/config')
const express = require('express');
const app = express();
const cors = require('cors');
const cookieParser = require('cookie-parser')
app.use(cookieParser())
const middleware = require('./utils/middleware')
app.use(middleware.tokenExtractor)
const loginRouter = require('./controllers/login')
const signupRouter = require('./controllers/signup')
const stepsRouter = require('./controllers/stepsController')

// Use CORS middleware
app.use(cors({
    origin: '*', // Replace with your frontend's domain
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify allowed methods
    credentials: true // Allow cookies to be sent with requests
}));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Expose-Headers', 'Authorization'); // Add this line
    next();
});

// Connect to MongoDB
const mongoose = require('mongoose');

const mongodb_uri = config.MONGODB_URI
mongoose
  .connect(mongodb_uri, { })
  .then(() => console.log('Database connected'))
  .catch(error => console.log('DB connection error:', error));

// Middleware (very particular Order)
app.use(express.json());  // to parse JSON
app.use(middleware.requestLogger)  // logs details about HTTP requests

console.log('Middlewares loaded')

// Route requests
app.use('/public/new-user', signupRouter);
app.use('/public/login', loginRouter);

app.use(middleware.tokenExtractor) 
app.use(middleware.userExtractor) // User validation

app.use('/api/v1/steps', stepsRouter)
console.log('Routes loaded')

// Error Handling Middleware
app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)
console.log('Error handlers loaded')


// export to index
module.exports = app