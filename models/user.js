const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        minLength: 5
    },
    name: {
        type: String,
        required: true,
        minLength: 5
    },
    passwordHash: {
        type: String,
        required: true
    },
    // reference Steps collection via objectId --> 1:M(1 user-to-Many steps) relationship
    steps: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Step'
        }
    ]
})

// transform DB fields in collection
userSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString()
        delete returnedObject._id
        delete returnedObject.__v
        delete returnedObject.passwordHash  // conceal password from display
    }
})

module.exports = mongoose.model('User', userSchema)