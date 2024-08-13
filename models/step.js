const mongoose = require('mongoose')

// id, name, description, createdByUserId
const stepSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minLength: 5
    },
    description: {
        type: String,
        required: true,
        minLength: 10
    },
    // reference Users collection --> 1:M relationship (1 user-to-Many steps)
    user : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
})

// transform DB fields in collection
stepSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString()
        delete returnedObject._id
        delete returnedObject.__v
    }
})

module.exports = mongoose.model('Step', stepSchema)