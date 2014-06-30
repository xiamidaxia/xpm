/**
 *  Package Model, this instance can be added to the xpm.
 *
 *  @author liuwencheng [xiamidaxia@gmail.com]
 *
 */
var path = require('path')
var EventEmitter = require('events').EventEmitter
var _ = require("underscore")
var fs = require('fs')
var coffee = require('coffee-script')

var util = require('./util')
var assertType = util.assertType
var extend = util.extend
var glob = require('glob')

/**
 * @param {Object}
 *      {
 *          path: {String} package real path
 *          type: {String} "server" | "client"
 *      }
 */
function _Package(config) {
    if (!~["server", "client"].indexOf(config.type)) throw new Error("unknow Package type: " + config.type)
    this._path = config.path
    this._family = path.basename(path.join(config.path, ".."))
    this._name = path.basename(config.path)
    this._type = config.type
    //保存一些说明信息
    this._info
    //保存一些依赖信息
    this._data = {require:[],exports:[],files:[],imports:[],alias:{}}
    //为true相当于nodejs里的module.exports扩展
    this.isModule = false
    this._exports = {}
    this.readPackageFile()
}
require('util').inherits(_Package, EventEmitter)

_.extend(_Package.prototype, {
    /**
     * [all]
     * @param {Object} data
     * @private
     */
    _addData: function(data) {
        var self = this
        var _arrKeys = ["defaults", "require", "imports", "exports", "files", "tests"]
        _.each(data, function(items, key) {
            if (~_arrKeys.indexOf(key))
                assertType(items, "Array", self._msg("key '" + key + "' need an Array."))
            switch (key) {
                case "require":
                case "defaults":
                    items = items.map(function(packname) {
                        if (!/.+\/.+/.test(packname)) {
                            return self._family + "/" + packname
                        } else {
                            return packname
                        }
                    })
                    //默认中包含该包则忽略
                    if (key === "defaults" && ~items.indexOf(self._family + "/" + self._name)) {
                        return
                    }
                    key = "require"
                case "imports":
                case "exports":
                case "tests":
                    self._data[key] = _.union(
                            self._data[key] || [],
                        items
                    )
                    break;
                case "files":
                    self._data[key] = _.union(
                            self._data[key] || [],
                        items
                    )
                    break;
                case "alias":
                    assertType(items, "Object", "'" + key + "' need an Object .")
                    self._data[key] = _.extend(self._data[key] || {}, items)
                    break;
                default:
                    throw new Error(self._msg("unknow key '" + key + "'"))
            }
        })
    },
    /**
     * [server]
     *
     * @param {Object} 执行时候加载的require作用域
     */
    execServer: function(requireContext) {
        var self = this
        var _context = requireContext || {}
        //使用别名
        _.each(this._data.alias, function(alias, name) {
            if (_context[name]) {
                //throw new Error(self._msg("unknow alias name: " + name))
                _context[alias] = _context[name]
                delete _context[name]
            }
        })
        //执行加载的文件
        this.getFiles().forEach(function(filepath) {
            var _execRet = util.execFileByContext(filepath, _context)
            if (!_execRet.isModule) {
                extend(_context, _execRet.ret)
            } else {
/*                if (index !== arr.length - 1)
                    throw new Error(self._msg("module.exports只能用在files数组包含的最后一个文件."))*/
                if (self._data.exports.length !== 1) {
                    throw new Error(self._msg("使用module.exports, 需要在package.js指定exports数组，且数组只能有一个选项。"))
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
            if (!self._exports) throw new Error(self._msg("exports扩展 ‘" + self._data.exports[0] + "’ 不存在"))
        }
        //get exports
        self._data.exports.forEach(function(item) {
            if (!_context[item]) {
                throw new Error(self._msg("exports扩展 ‘" + item + "’ 不存在"))
            }
            self._exports[item] = _context[item]
        })
        return self._exports
    },
    getExports: function() {
        return this._exports
    },
    /**
     * [server]
     * 将exports扩展到指定作用域
     */
    exportsToContext: function(context) {
        var self = this
        assertType(context, "Object", "context should be an Object.")
        if (!this.isModule) {
            this._data.exports.forEach(function(name) {
                context[name] = self._exports[name]
            })
        } else {
            context[self._data.exports[0]] = self._exports //采用第一个
        }
        return context
    },
    /**
     * @param {Boolean | Ignore} isTest
     * @returns {Array}
     */
    getFiles: function(isTest) {
        var files = [], self = this
        var datas = isTest ? this._data.tests : this._data.files
        datas.forEach(function(item) {
            var _files = glob.sync(item, {
                "cwd": self._path
            })
            files = files.concat(_files)
        })
        files = files.map(function(filename) {
            return path.join(self._path, filename)
        })
        files = _.without(files, path.join(self._path, "package.js"))
        return files
    },
    getFilesSplitingByExtname: function(isTest) {
        var files = this.getFiles(isTest)
        var ret = {}
        files.forEach(function(file) {
            var extname = path.extname(file)
            if (extname === "") extname = "__unknown__"
            else extname = extname.substr(1)
            if (!ret[extname]) ret[extname] = []
            ret[extname].push(file)
        })
        return ret
    },
    /**
     * [all]
     * read package.js file with current package instance context.
     */
    readPackageFile: function() {
        var defaultFile
        try {
            defaultFile = fs.realpathSync(path.join(this._path, "..", "package.js"))

        } catch (e) {}
        //load default Package.js
        if (defaultFile) util.execFileByContext(defaultFile, {Package: this})
        //load Package.js
        util.execFileByContext(path.join(this._path, "package.js"), {Package: this})
    },
    /**
     * @param info
     */
    describe: function(info) {
        this._info = info
    },
    /**
     */
    server: function(data) {
        if (this._type === "server")
            this._addData(data)
    },
    /**
     */
    client: function(data) {
        if (this._type === "client")
            this._addData(data)
    },
    /**
     */
    all: function(data) {
        this._addData(data)
    },
    _msg: function(msg) {
        return "[" + this._family + "/" + this._name + "] " + msg
    }
})
module.exports = _Package