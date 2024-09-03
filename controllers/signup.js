// imports
const signupRouter = require('express').Router()
const bcrypt = require('bcryptjs')
const User = require('../models/user')

signupRouter.post('/', async(request, response, next) => {
    const { username, name, password } = request.body
    
    // validate password - not handled in DB Schema
    const specialChars = /[\W_]/
    if(!password || password.length < 6 || !specialChars.test(password)){
        // Instead of throwing an error, pass it to the next middleware
        const error = new Error('Password must be greater than 6 characters and must include special characters')
        error.name = 'ValidationError'
        return next(error)
    }
    try {
            const saltRounds = 10
            const passwordHash = await bcrypt.hash(password, saltRounds)
            const userToRegister = new User({
                username: username,
                name: name,
                passwordHash: passwordHash
            })
            const savedUser = await userToRegister.save()
            response.status(200).json(savedUser)
    } catch (error) {
        next(error)
    }
})

module.exports = signupRouter