require('dotenv').config()
const morgan = require('morgan')
const requestLogger = morgan('dev')
const jwt = require('jsonwebtoken')
const User = require('../models/user')
const config = require('./config')

const unknownEndpoint = (request, response, next) => {
    response.status(404).send({ error: 'Unknown Endpoint' })
    next()
}

const errorHandler = (error, request, response, next) => {
    console.error(error.message)
    if(error.name === 'ValidationError'){
        response.status(400).send({error: error.message})
    }
    next()
}

// retrieve token from httpOnly cookie
const tokenExtractor = (request, response, next) => {
    request.token = request.headers.authorization
    next()
}

// validate user's JWT and authenticate user access - to be used in stepsController.js
const userExtractor = async (request, response, next) => {
    try {
        const decodedToken = jwt.verify(request.token, config.SECRET);
        const user = await User.findById(decodedToken.id);
        if (!user) {
            return response.status(401).json({ error: 'User not found. Authentication failed.' });
        }
        request.user = user;
        next();
    } catch (error) {
        console.error(error);
        response.status(401).json({ error: 'Invalid Token. User authentication failed.' });
    }
}

// export to app
module.exports = { requestLogger, unknownEndpoint, errorHandler, tokenExtractor, userExtractor }