require('dotenv').config()

const path = require('path')
const Quark = require('../index.js')

const proton = { app: { path: __dirname } }

describe('Quark test', () => {
  it('should load exchanges and queues', function*() {
    const quark = new Quark(proton)
    //yield quark.validate()
    yield quark.initialize()
    //yield quark.configure()
  })

  it('should show `proton.app.amqp`', function*() {
    console.log(`proton.app.amqp.queues: ${proton.app.amqp.queues.AMQPQueueTest}`)
    console.log(`proton.app.amqp.exchanges: ${proton.app.amqp.exchanges.AMQPExchangeTest}`)
  })
})
