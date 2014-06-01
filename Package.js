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
var coffee = require('coffee-script')

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
    this._data = {require: [], exports: [], files: [], alias: {}}
    this._default = config.default || false
    this._test = {files: []}
    //为true相当于nodejs里的module.exports扩展
    this.isModule = false
    if (config.type === "server") {
        this._exports = {}
        //use to test
        this._context = null
        this._data.nrequire = []
    } else {
        //版本号, 用于client端确定包的md5值 todo
        this._version = null
    }
    //为默认包则包含imports属性 todo: remove
    if (this._default) {
        this._data.imports = []
    }
    //按顺序依赖的数组 {Array}, 该值可用于检测是否循环依赖
    this._sequencyRequire = null
    this.readPackagejs()
}
require('util').inherits(_Package, EventEmitter)
proto = _Package.prototype
proto._addData = function(data) {
    var self = this
    _.each(data, function(item, key) {
        if (self._default && !~(["defaults", "imports", "alias", "nrequire"].indexOf(key))) {
            throw new Error("default package can not use opts key: '" + key + "'!")
        }
        if (key == "nrequire" && self._type !== "server") {
            throw new Error("nrequire only use in the server!")
        }
        switch (key) {
            case "defaults":
                //defaults转化为require
                key = "require"
            case "nrequire":
            case "imports":
            case "require":
            case "exports":
            case "files":
                assertType(item, "Array", "'" + key + "' need an Array in package " + self._name + ".")
                if (key === "files")
                    item.forEach(function(filename, index) {
                        if (path.extname(filename) === "") {
                            item[index] = filename + ".js"
                        }
                    })
                self._data[key] = _.union(
                    self._data[key],
                    item
                )
                break;
            case "alias":
                assertType(item, "Object", "'" + key + "' need an Object .")
                _.extend(self._data[key], item)
                break;
            default:
                throw new Error("unknow config key '" + key + "' in the " + self._type + " package '" + self._name + "'.")
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
    var _context = self._context = _.clone(requireContext || {})
    //加入npm包的扩展
    var nrequire = util.getRequireFn(self.getFilePath("package.js"))
    this._data.nrequire.forEach(function(item) {
        _context[item] = nrequire(item)
    })
    //使用别名
    _.each(this._data.alias, function(alias, name) {
        if (!_context[name]) {
            throw new Error("["+self._name+"] unknow alias name: " + name)
        }
        _context[alias] = _context[name]
        delete _context[name]
    })
    //如果是默认包，则返回不执行
    if (self._default) {
        return this._exports = _context
    }
    //执行加载的文件
    this._data.files.forEach(function(filename, index, arr) {
        var filepath = self.getFilePath(filename)
        var _execRet = util.execFileByContext(filepath, _context, true)
        if (!_execRet.isModule) {
            extend(_context, _execRet.ret)
        } else {
            if (index !== arr.length - 1)
                throw new Error("module.exports只能用在files数组包含的最后一个文件.")
            if (self._data.exports.length !== 1) {
                throw new Error("包 '" + self._name + "' 需要指定exports数组，且数组只能有一个选项。")
            }
            //扩展到context
            _context[self._data.exports[0]] = _execRet.ret
            //module.exports返回则直接相等
            self._exports = _execRet.ret
            self.isModule = true
        }
    })
    if (self.isModule) {
        return self._exports
    }
    //处理exports数组只有一个选项情况, 当作类似module.exports处理
    if (self._data.exports.length === 1) {
        self.isModule = true
        self._exports = _context[self._data.exports[0]]
        if (!self._exports) throw new Error("包 '" + self._name + "' 的exports扩展 ‘" + self._data.exports[0] + "’ 不存在")
    }
    //get exports
    self._data.exports.forEach(function(item) {
        if (!_context[item]) {
            throw new Error("包 '" + self._name + "' 的exports扩展 ‘" + item + "’ 不存在")
        }
        self._exports[item] = _context[item]
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
    var packname = path.basename(this._cwd)
    var _contentStart = "/** " + packname + "." + this._name + " **/" +
        "define(function(require, exports, module){\n"
    var _contentEnd = "})"
    var _r
    var self = this
    //加入外部的require
    this._data.require.forEach(function(item) {
        item = self._data.alias[item] || item
        _r = "var " + item + " = " + "require(\"" + packname + "/" + item + "\");\n"
    })
    this._data.files.forEach(function(filename) {
        var filepath = self.getFilePath(filename)
        var filecode = fs.readFileSync(filepath).toString()
        //编译coffee
        if (path.extname(filepath) === ".coffee") {
            filecode = coffee.compile(filecode, {bare: true, filename: filepath});
        }
        fileContent += filecode + "\n"
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
 * 将exports扩展到指定作用域
 */
proto.exportsToContext = function(context) {
    var self = this
    assertType(context, "Object", "context should be an Object.")
    if (this._default) {
        return _.extend(context, this._exports)
    }
    if (!this.isModule) {
        this._data.exports.forEach(function(name) {
            context[name] = self._exports[name]
        })
    } else {
        context[self._data.exports[0]] = self._exports //采用第一个
    }
    return context
}
/**
 * read package.js file with current package instance context.
 */
proto.readPackagejs = function() {
    var packagePath
    packagePath = this.getFilePath("package.js")
    //load Package.js
    util.execFileByContext(packagePath, {Package: this}, true)
}
proto.getFilePath = function(filename) {
    if (!this._default)
        return path.join(this._cwd, this._name, filename)
    else
        return path.join(this._cwd, filename)
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

proto.test = function(opts) {
    if (opts && opts.files) {
        assertType(opts.files, "Array")
        opts.files.forEach(function(filename, index) {
            if (path.extname(filename) === "") {
                opts.files[index] = filename + ".js"
            }
        })
        this._test.files = _.union(this._test.files, opts.files)
    }
}

module.exports = _Package