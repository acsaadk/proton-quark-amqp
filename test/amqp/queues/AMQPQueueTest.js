'use strict'

const Queue = require('proton-amqp-queue')

module.exports = class AMQPQueueTest extends Queue {

  constructor(channel, name) {
    super(channel, name)
    console.log('AMQPQueueTest.constructor: afterCreateChannel')
  }

  static get url() {
    return process.env.CLOUDAMQP_URL
  }

  static *beforeCreateChannel(conn) {
    console.log('AMQPQueueTest.beforeCreateChannel')
    process.once('SIGINT', () => {
      console.log('Ctrl+C: Closing connection')
      conn.close()
    })
    conn.on('close', () => console.log('Connection.onClose:', 'Connection closed'))
  }

  onClose() {
    console.log('AMQPQueueTest.onClose:', 'Channel closed')
  }

  get bindings() {
    return [{
      source: "AMQPExchangeTest"
    }]
  }

  get consumeOptions() {
    return {
      exclusive: true
    }
  }

  * consume(msg) {
    console.log('AMQPQueueTest:consume', msg.content.toString())
    yield this.ack(msg)
  }
}
