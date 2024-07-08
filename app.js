// imports
const config = require('./utils/config')
const express = require('express');
const app = express();
const cookieParser = require('cookie-parser')
app.use(cookieParser())
const middleware = require('./utils/middleware')
const loginRouter = require('./controllers/login')
const signupRouter = require('./controllers/signup')
const stepsRouter = require('./controllers/stepsController')


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
app.use(middleware.tokenExtractor) 
app.use(middleware.userExtractor) // User validation
console.log('Middlewares loaded')

// Route requests
app.use('/public/signup', signupRouter);
app.use('/public/login', loginRouter);
app.use('/api/v1/steps', stepsRouter)
console.log('Routes loaded')

// Error Handling Middleware
app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)
console.log('Error handlers loaded')


// export to index
module.exports = app