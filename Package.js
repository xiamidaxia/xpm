/**
 *  Package Model, this instance can be added to the xpm.
 *
 *  @author liuwencheng [xiamidaxia@gmail.com]
 *
 */
var util = require('./util')
var path = require('path')
var EventEmitter = require('events').EventEmitter
var _ = require("underscore")
var assertType = util.assertType
var extend = util.extend
var fs = require('fs')

var proto
/**
 * @param {Object}
 *      {
 *          cwd: {String}
 *          name: {String}
 *          type: {String} server | client
 *          default: false //是否为默认包
 *      }
 */
function _Package(config) {
    if (!~["server", "client"].indexOf(config.type)) throw new Error("unknow Package type: " + config.type)
    this._cwd = config.cwd
    this._name = config.name
    this._type = config.type
    this._data = {require: {}, exports: {}, files: []}
    this._default = config.default || false //是否为default类包
    if (config.type === "server") {
        this._exports = {}
        this._data.nrequire = {}
    } else {
        this._version = null //版本号, 用于确定包的md5值 todo
    }
    if (this._default) {
        this._data.imports = {}
        this._data.exports = this._data.require
    }
    this._sequencyRequire = null //按顺序依赖的数组 {Array}, 该值可用于检测是否循环依赖
    this.readPackagejs()
}
require('util').inherits(_Package, EventEmitter)
proto = _Package.prototype
proto._addData = function(data) {
    var self = this
    _.each(data, function(item, key) {
        var _item
        if (self._default && !~(["defaults", "imports"].indexOf(key))) {
            throw new Error("default package only can use 'defaults' and 'imports', key '"+key+"' uncorrect !")
        }
        if (key == "nrequire" && self._type !== "server") {
            throw new Error("nrequire only use in the server!")
        }
        switch (key) {
            case "defaults":
                key = "require" //defaultRequire转化为require
            case "nrequire":
            case "imports":
            case "require":
            case "exports":
                assertType(item, "Array | Object", "'" + key + "' need a Array or Object.")
                if (_.isArray(item)) {
                    _item = {}
                    item.forEach(function(n) {
                        _item[n] = n
                    })
                }
                extend(self._data[key], _item || item)
                break;
            case "files":
                assertType(item, "Array", "'files' need a Array.")
                item.forEach(function(filename, index) {
                    item[index] = filename.split(".js")[0] + ".js" //todo check other file types
                })
                self._data[key] = _.union(
                    self._data[key],
                    item
                )
                break;
            default:
                throw new Error("unknow key '" + key + "' in the " + self._type + " package '" + self._name + "'.")
        }
    })
}
proto.exec = function(requireContext) {
    if (this._type === "server") {
        return this._execServer(requireContext)
    } else {
        return this._execClient()
    }
}
/**
 * [server]
 * 执行时候加在的require作用域
 * @param {Object}
 */
proto._execServer = function(requireContext) {
    var self = this
    //if (self._name == "__default__") console.log(requireContext)
    //exec files
    requireContext = requireContext || {}
    _.each(this._data.nrequire, function(item, key) {
        requireContext[key] = require(item)
    })
    this._data.files.forEach(function(filename, index, arr) {
        var filepath = path.join(self._cwd, self._name, filename)
        var _execRet = util.execFileByContext(filepath, requireContext)
        if (!_execRet.isModule) {
            extend(requireContext, _execRet.ret)
        } else {
            if (index !== arr.length - 1)
                throw new Error("module.exports不能用在: " + self._name + "/" + filename)
            self._exports = _execRet.ret //module返回则直接相等
        }
    })
    //get exports
    _.each(self._data.exports, function(item, key) {
        self._exports[key] = requireContext[item]
    })
    return self._exports
}
/**
 * [client]
 * @param {Array} 依赖数组
 * //todo use buffer stream, md5
 */
proto._execClient = function() {
    var _content = this._getFileContent()
    //todo
    // console.log(_content)
    //console.log(_content)
    //md5
    //console.log("gagag")
    //console.log(_content)
}

/**
 * [client]
 * @return {String}
 */
proto._getFileContent = function() {
    var fileContent = ""
    var _contentStart = "define(function(__require__, exports, module){"
    var _contentEnd = "})"
    var _r
    var self = this
    _.each(this._data.require, function(item, key) {
        _r = "var " + item + " = " + "__require__(\"" + key + "\");"
    })
    this._data.files.forEach(function(filename) {
        var filepath = path.join(self._cwd, self._name, filename)
        fileContent += fs.readFileSync(filepath).toString() + "\n"
    })
    return fileContent = _contentStart + fileContent + _contentEnd
}
/**
 * [server]
 * 在加载依赖的context后调用，每个文件以串联方式执行
 */
proto.getExports = function() {
    return this._exports
}
proto.getImports = function() {
    return this._data.imports
}
/**
 * 获取包的无顺序依赖数组
 * @return {Array}
 */
proto.getRequireArr = function() {
    var result = []
    for (var i in this._data.require) {
        result.push(this._data.require[i])
    }
    return result
}
proto.getRequire = function() {
    return this._data.require
}
proto.setSequencyRequire = function(arr) {
    return this._sequencyRequire = arr
}
proto.getSequencyRequire = function() {
    return this._sequencyRequire
}
/**
 * read package.js file with current package instance context.
 */
proto.readPackagejs = function() {
    var packagePath
    if (this._default)
        packagePath = path.join(this._cwd, "package.js")
    else
        packagePath = path.join(this._cwd, this._name, "package.js")
    //load Package.js
    util.execFileByContext(packagePath, {Package: this})
}
proto.describe = function(info) {
    this._info = info
}
/**
 * @public
 */
proto.server = function(data) {
    if (this._type === "server")
        this._addData(data)
}
/**
 * @public
 */
proto.client = function(data) {
    if (this._type === "client")
        this._addData(data)
}
/**
 * @public
 */
proto.all = function(data) {
    this._addData(data)
}

module.exports = _Package