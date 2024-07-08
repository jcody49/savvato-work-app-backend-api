const testAgent = require('supertest')
const express = require('express')
const app = express()


app.post('/api/test', (request, response) => {
    response.send('This is a test') 
})

describe('POST /api/test', () => {
    it('responds with a string', async() => {
        const response = await testAgent(app)
                            .post('/api/test')
                            .send();

        expect(response.statusCode).toBe(200)
        expect(response.text).toBe('This is a test')
    })
})
