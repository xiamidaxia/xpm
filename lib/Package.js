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
var DEFAULT_FILE_MATCH = ["**/*"]
var DEFAULT_TEST_MATCH = ["*+(T|t)est*", "test/**/*"]

/**
 * @param {Object}
 *      {
 *          path: {String} package real path
 *          type: {String} "server" | "client",
 *          xpm: {Object} Xpm instance
 *      }
 */
function _Package(config) {
    if (!~["server", "client"].indexOf(config.type)) throw new Error("unknow Package type: " + config.type)
    this._path = config.path
    this._family = path.basename(path.join(config.path, ".."))
    this._name = path.basename(config.path)
    this._type = config.type
    this._xpm = config.xpm
    //保存包说明信息
    this._info
    //保存包的数据信息
    this._data = {
        require: [],
        exports: [],
        imports: [],
        files: DEFAULT_FILE_MATCH,
        tests: DEFAULT_TEST_MATCH,
        alias: {},
        main: "index.js",
        auto: false
    }
    //为true相当于nodejs里的module.exports扩展
    this.isModule = false
    //包的对外扩展
    this._exports = null
    //每个文件执行的全局作用域
    this._context = {}
    //所有已加入的文件名
    this._allfiles
    //主入口
    this._mainpath
    //所有已执行的文件缓存
    this._fileCache = {}
    //是否执行
    this.isRun = false
    //读取Package.js文件
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
        var _arrKeys = ["defaults", "require", "files", "tests", "imports"]
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
                case "files":
                case "tests":
                    if (self._data[key] === DEFAULT_FILE_MATCH || self._data[key] === DEFAULT_TEST_MATCH) {
                        self._data[key] = []
                    }
                    self._data[key] = _.union(
                        self._data[key] || [],
                        items
                    )
                    break
                case "exports":
                    assertType(items, "Array|String", self._msg("key '" + key + "' need an Array or String."))
                    if (typeof items === "string") {
                        self._data[key] = items
                    } else {
                        if(!_.isArray(self._data[key]))
                            self._data[key] = []
                        self._data[key] = _.union(self._data[key], items)
                    }
                    break
                case "alias":
                    assertType(items, "Object", self._msg("key'" + key + "' need an Object ."))
                    self._data[key] = _.extend(self._data[key] || {}, items)
                    break
                case "main":
                    assertType(items, "String", self._msg("key'" + key + "' need a String. "))
                    self._data[key] = items
                    break
                case "auto":
                    assertType(items, "Boolean", self._msg("key'" + key + "' need a Boolean. "))
                    self._data["auto"] = items
                    break
                default:
                    throw new Error(self._msg("unknow key '" + key + "'"))
            }
        })
    },
    /**
     * [server]
     *
     */
    execServer: function(requireContext) {
        var self = this
        var _context = this._context = requireContext || {}
        if (this.isRun) return this._exports
        //set context
        _.each(this._data.alias, function(alias, name) {
            if (_context[name]) {
                //throw new Error(self._msg("unknow alias name: " + name))
                _context[alias] = _context[name]
                delete _context[name]
            }
        })
        //set allfiles
        this._allfiles = this.getFiles()
        //set mainpath
        this._mainpath = path.join(self._path, self._data.main)
        if (path.extname(this._mainpath) === "")
            this._mainpath = this._mainpath + ".js"
        if (!self._data.auto) return
        //exec main file
        var mainReturn = self.execMainFile()
        if (! mainReturn.isModule) {
            //get exports
            self._data.exports.forEach(function(item) {
                if (!self._exports) self._exports = {}
                self._exports[item] = mainReturn.ret[item]
            })
        } else {
            if (!self._data.exports || typeof self._data.exports !== "string") {
                throw new Error(self._msg('need to config `exports` as a String in package.js'))
            }
            self.isModule = true
            self._exports = mainReturn.ret
        }
        this.isRun = true
        return self._exports
    },
    execMainFile: function() {
        //exec main file
        var self = this
        if (!fs.existsSync(this._mainpath)) {
            return {
                isModule: false,
                ret: null
            }
        } else {
            return  self._xpm._execFile({
                family: self._family,
                packname: self._name,
                path: this._mainpath,
                ismain: true
            })
        }
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
        if (!this._data.auto) return context
        if (!this.isModule) {
            assertType(this._data.exports, "Array", this._msg("need to config 'exports' as an Array in package.js"))
            this._data.exports.forEach(function(name) {
                context[name] = self._exports[name]
            })
        } else {
            context[self._data.exports] = self._exports
        }
        return context
    },
    /**
     * @returns {Array}
     */
    getFiles: function() {
        var files = [], self = this
        if (this._allfiles) return this._allfiles
        this._data.files.forEach(function(item) {
            var _files = glob.sync(item, {
                "cwd": self._path
            })
            files = _.union(files, _files)
        })
        files = _.without.apply(_, [files, "package.js"].concat(self.getTestFiles()))
        this._allfiles = files
        return files
    },
    getTestFiles: function() {
        var files = [], self = this
        this._data.tests.forEach(function(item) {
            var _files = glob.sync(item, {
                "cwd": self._path
            })
            files = _.union(files, _files)
        })
        files = _.without(files, "package.js")
        return files
    },
    getFilesSplitingByExtname: function(isTest) {
        var files = this.getFiles(isTest)
        var ret = {}
        files.forEach(function(file) {
            var extname = path.extname(file)
            if (extname === "") extname = "__unknown__"
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
        var packpath = path.join(this._path, "package.js")
        if (!fs.existsSync(packpath))
            throw new Error("Can not load package: \"" + this._family + "/" + this._name + "\"")
        util.execFileByContext(packpath, {Package: this})
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