/**
 *  Xiami Package Manager (XPM) Server Model.
 *
 *  @author liuwencheng [xiamidaxia@gmail.com]
 *
 */
var _ = require('underscore')
var path = require('path')
var fs = require('fs')

var Package = require('./Package')
var Xpm = require('./Xpm')

/**
 * Xpm Server module
 *
 * @constructor
 * @public
 * @param {Object} config
 *      {
 *          "cwd": {String} 工作目录
 *      }
 */
function XpmServer(config) {
    Xpm.call(this, config)
    this._type = "server"
}
require('util').inherits(XpmServer, Xpm)
_.extend(XpmServer.prototype, {
    /**
     * @param {String} path  "family/pack"
     * @returns {Object}
     */
    use: function(path) {
        if(!/.+\/.+/.test(path)) throw new Error('参数不符合要求!')
        path = path.split('/')
        return this.addPackage(path[0], path[1])
    },
    /**
     *
     * @param {String} path  "family/pack"
     * @returns {*}
     */
    require: function(path) {
        if(!/.+\/.+/.test(path)) throw new Error('参数不符合要求!')
        path = path.split('/')
        return this.addPackage(path[0], path[1]).getExports()
    },
    /**
     * @param family
     * @param packageName
     * @returns {Object}
     */
    addPackage: function(family, packageName) {
        var p, fullname, context = {}, self = this
        fullname = path.join(family, packageName)
        if (this._map[fullname]) return this._map[fullname]

        p = Xpm.prototype.addPackage.apply(this, arguments)
        p._data.require.forEach(function(pname) {
            self._map[pname].exportsToContext(context)
        })
        p.execServer(context)
        return p
    }
})


module.exports = XpmServer
