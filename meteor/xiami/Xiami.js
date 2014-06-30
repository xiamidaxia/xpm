/**
 *  a simple connect webserver
 *
 *  @author xiamidaxia(https://github.com/xiamidaxia)
 */
"use strict"

var EventEmitter = require('events').EventEmitter
var crypto = require('crypto')

var connect = require('connect')

var Xiami

//all events that can be hook
var DEFINE_EVENTS = ['STARTED']
/**
 *
 * @constructor
 * @param {Object}
 * @param {Object | Ignore}
 */
Xiami = function(config, clientManifest) {
    EventEmitter.apply(this, arguments)
    this._opts = _.extend({}, default_config, config)
    //客户端缓存的manifest对象
    this.clientManifest = clientManifest
    //客户端缓存的hash值，用此判断服务器是否需要刷新manifest
    this.clientHash = null
    //Webserver
    this.app = connect()
    // Packages and apps can add handlers before webserver run
    this.connectHandler = connect()
}
require('util').inherits(Xiami, EventEmitter)

_.extend(Xiami.prototype, {
    version: "0.0.1",
    DEFINE_EVENTS: DEFINE_EVENTS,
    /**
     * run the server
     */
    run: function() {
        this._connect()
    },
    _connect: function() {
        var app = this.app
        var self = this

        app.use(connect.compress())
        app.use(this.connectHandler)
        app.use(connect.query())

        app.listen(this.getConfig("port"), function() {
            self.emit('STARTED')
            Log.info('xiami server listeing at ' + self.getConfig('port'))
        })
        //app.use(connect.compress())
        //app.use(connect.bodyParser())
        //app.use(connect.static(this.getConfig("client_path",staticConfig)))
        //app.use(connect.errorHandler())
    },
    /**
     * @param {String}
     * @return {*}
     */
    getConfig: function(name) {
        var val
        if (!_.isString(name)) throw new Error("xiami.getConfig([String]): need a String param.")
        val = this._opts[name]
        if (!val) throw new Error("xiami.getConfig([String]): unfind config name: " + name)
        return val
    },
    /**
     * @public
     */
    isDebug: function() {
        return this.getConfig('env') !== "production"
    },
    /**
     * 计算客户端hash值
     * @return {String}
     */
    _calculateClientHash: function() {
        var hash = crypto.createHash('sha1')
        hash.update(JSON.stringify(this._opts))
        _.each(this.clientManifest, function(resource) {
            if (resource.where === 'client' || resource.where === 'internal') {
                hash.update(resource.path)
                hash.update(resource.hash)
            }
        })
        return hash.digest('hex')
    }
})

exports.Xiami = Xiami
