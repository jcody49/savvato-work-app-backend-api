// imports
require('dotenv').config()  // to generate token
const loginRouter = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/user')
const config = require('../utils/config')

loginRouter.post('/', async(request, response, next) => {
    const { username, password } = request.body
    try {
        const registeredUser = await User.findOne({ username: username })
        if(!registeredUser){
            console.error('User does not exist. Signup for access.')
            response
                .status(401)
                .send({ error: 'User does not exist. Signup for access.'})
        }
    
        const validPassword = password === null 
            ? false 
            : await bcrypt.compare(password, registeredUser.passwordHash)
        if(!validPassword){
            console.error('Invalid Password. Provide the associated password to username.')
            response
            .status(401)
            .send({ error: 'Invalid Password. Provide the associated password to username.'})
        }

        // generate jwt for valid user
        const userToAuthenticate = {
            username: registeredUser.username,
            id: registeredUser._id
        }
        // expires in 60 minutes
        const token = jwt.sign(
            userToAuthenticate, 
            config.SECRET, 
            {expiresIn: 60 * 60}
        )

        response.header('Authorization', token);
        
        response
            .status(200)
            .send({ username: registeredUser.username, name: registeredUser.name })
    }
    catch (error) 
    {
        console.error('Error during Login: ', error)
        
    }
})


// export to app
module.exports = loginRouter
