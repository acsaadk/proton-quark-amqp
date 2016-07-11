'use strict'

const Quark = require('proton-quark')
const fs = require('fs')
const path = require('path')
const _ = require('lodash')
const amqp = require('amqplib')

module.exports = class AMQPQuark extends Quark {

  constructor(proton) {
    super(proton)
    proton.app.amqp = { exchanges: {}, queues: {}, __connections: [] }
  }

  validate() {
    // Nothing to do ....
  }

  initialize() {
    co.wrap(this._initializeQueues)()
    co.wrap(this._initializeExchanges)()
  }

  * _initializeQueues() {
    const queues = this._queues
    for(let Q in queues) {
      const queue = queues[Q]
      let conn = this._existsConn({ url: queue.url, socketOptions: queue.socketOptions })
      if(!conn) conn = yield this._connect(queue)
      yield this._initializeQueue(queue, (queue.customName || Q), conn)
    }
  }

  * _initializeExchanges() {
    const exchanges = this._exchanges
    for(let E in exchanges) {
      const exchange = exchanges[E]
      let conn = this._existsConn({ url: exchange.url, socketOptions: exchange.socketOptions })
      if(!conn) conn = yield this._connect(exchange)
      yield this._initializeExchange(exchange, (exchange.customName || E), conn)
    }
  }

  configure() {
    // Nothing to do ....
  }

  get _exchanges() {
    const exchangesPath = path.join(this.proton.app.path, '/amqp/exchanges')
    return fs.existsSync(exchangesPath) ? require('require-all')(exchangesPath) : {}
  }

  get _queues() {
    const queuesPath = path.join(this.proton.app.path, '/amqp/queues')
    return fs.existsSync(queuesPath) ? require('require-all')(queuesPath) : {}
  }

  * _connect(ExQ) {
    const conn = yield amqp.connect(ExQ.url, ExQ.socketOptions)
    this.proton.app.amqp.__connections.push({
      params: {
        url: ExQ.url,
        socketOptions: ExQ.socketOptions
      },
      connection: conn
    })
    return conn
  }

  * _createChannel(ExQ, conn) {
    yield ExQ.beforeCreateChannel(conn)
    const ch = yield conn.createChannel()
    return ch
  }

  * _initializeExchange(E, name, conn) {
    const ch = yield this._createChannel(E, conn)
    yield ch.assertExchange(name, E.type, E.options)
    const exchange = new E(ch, name)
    yield this._bindingsFromExchange(exchange)
    this.proton.app.amqp.exchanges[name] = exchange
  }

  * _initializeQueue(Q, name, conn) {
    const ch = yield this._createChannel(Q, conn)
    yield ch.assertQueue(name, Q.options)
    const queue = new Q(ch, name)
    yield this._bindingsFromQueue(queue)
    this.proton.app.amqp.queues[name] = queue
  }

  * _bindingsFromExchange(exchange) {
    const bindings = exchange.bindings
    for(let b in bindings) {
      if(b.to === 'queue') {
        yield exchange.channel.bindQueue(bindings[b].source, exchange.name, bindings[b].routingKey, bindings[b].args)
      }else {
        yield exchange.channel.bindExchange(exchange.name, bindings[b].source, bindings[b].routingKey, bindings[b].args)
      }
    }
  }

  * _bindingsFromQueue(queue) {
    const bindings = queue.bindings
    for(let b in bindings) {
      yield queue.channel.bindQueue(queue.name, bindings[b].source, bindings[b].routingKey, bindings[b].args)
    }
  }

  _existsConn(conn) {
    const connections = this.proton.app.amqp.__connections
    let exists = false
    for(let c in connections) {
      if(_.isEqual(c.params, conn)) {
        exists = c.connection
        break
      }
    }
    return exists
  }

}
