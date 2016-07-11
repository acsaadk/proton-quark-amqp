'use strict'

const Exchange = require('proton-amqp-exchange')

module.exports = class AMQPExchangeTest extends Exchange {

  constructor(channel, name) {
    super(channel, name)
    console.log('AMQPExchangeTest.constructor: afterCreateChannel')
  }

  static get url() {
    return process.env.CLOUDAMQP_URL
  }

  static get type() {
    return Exchange.FANOUT
  }

  static *beforeCreateChannel(conn) {
    console.log('AMQPExchangeTest.beforeCreateChannel')
    process.once('SIGINT', () => {
      console.log('Ctrl+C: Closing connection')
      conn.close()
    })
    conn.on('close', () => console.log('Connection.onClose:', 'Connection closed'))
  }

  onClose() {
    console.log('AMQPExchangeTest.onClose:', 'Channel closed')
  }
}
