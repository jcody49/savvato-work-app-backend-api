
const Step = require('../models/step')
const User = require('../models/user')
const stepsRouter = require('express').Router()


// GET - get all steps created
stepsRouter.get('/', async(request, response, next) => {
    try {
        const allSteps = await Step
                        .find({})
                        .populate('user', {id: 1})
                        //similar to SQL JOIN
        
        response.json(allSteps)
    } 
    catch (error) {
        console.log('ERROR : ', error)
        next(error)
    }
})

// GET - steps created by specific user -- to debug
stepsRouter.get('/:id', async(request, response, next) => {
    try{
        const specificSteps = await Step.find({user: request.user.id})                        

        if (specificSteps.length > 0) {
            response.json(specificSteps)
        } else {
            response.status(404).end()
        }
    }
    catch(error){
        console.log('ERROR : ', error)
        next(error)
    }
})


// POST - create a step
stepsRouter.post('/', async(request, response, next) => {
try {
        const body = request.body
        const user = request.user
        console.log(user)
        const step = new Step({
                        ...body,
                        user: user.id
                    })
        const addedStep = await step.save()
    
        // update User collection with Step object Id reference 
        user.steps = user.steps.concat(addedStep._id)
        await user.save()
        console.log(`Step ${step.name} added by ${user.name}`)
    
        response.status(201).json(addedStep)
} catch (error) {
    console.log('ERROR : ', error)
    next(error)
}
})


module.exports = stepsRouter