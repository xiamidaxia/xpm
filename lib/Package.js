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
 *          family: {String}
 *          name: {String}
 *          type: {String} "server" | "client"
 *      }
 */
function _Package(config) {
    if (!~["server", "client"].indexOf(config.type)) throw new Error("unknow Package type: " + config.type)
    this._path = config.path
    this._family = config.family
    this._name = config.name
    this._type = config.type
    //保存包说明信息
    this._info
    //保存包的数据信息
    this._data = {
        imports: [],
        test_imports: [],
        files: [],
        test_files: [],
        main: "index.js",
        main_preload: false,
        all_preload: false
    }
    //每个文件执行的全局作用域
    this._context = {}
    //所有已加入的文件名
    this._allfiles
    this._testfiles
    //mainfile路径
    this._mainpath
    //所有已执行的文件缓存
    this._fileCache = {}
    //读取Package.js文件
    this.readPackageFile()
    this._config()
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
        var curFullname = self._family + "/" + self._name
        _.each(data, function(items, key) {
            switch (key) {
                case "imports":
                case "files":
                case "test_imports":
                case "test_files":
                    assertType(items, "Array | String", self._msg("key '" + key + "' need an Array or String."))
                    if (typeof items === "string")
                        items = [items]
                    if (key === "imports" && self._execDefault) {
                        self._addDefaultImports(items)
                    }
                    if (key === "imports" || key === "test_imports") {
                        items = self._getFullnameArr(items)
                        //without self
                        items = _.without(items, curFullname)
                    }
                    self._data[key] = _.union(
                        self._data[key] || [],
                        items
                    )
                    break
                case "main":
                    assertType(items, "String", self._msg("key'" + key + "' need a String. "))
                    self._data[key] = items
                    break
                case "main_preload":
                case "all_preload":
                    assertType(items, "Boolean", self._msg("key'" + key + "' need a Boolean. "))
                    self._data[key] = items
                    break;
                default:
                    throw new Error(self._msg("unknow key '" + key + "'"))
            }
        })
    },
    _getFullnameArr: function(items) {
        var self = this
        return items.map(function(packname) {
            if (/^[^\/]+$/.test(packname)) {
                return self._family + "/" + packname
            } else {
                return packname
            }
        })
    },
    /**
     *
     */
    _config: function() {
        var self = this
        var curFullname = self._family + "/" + self._name
        //set allfiles
        this._allfiles = this.getFiles()
        //set mainpath
        this._mainpath = self._data.main
        //remove default imports if this package is default
        if (this._defaultImports && ~this._defaultImports.indexOf(curFullname)) {
            this._data.imports = _.without.apply(_, [this._data.imports].concat(this._defaultImports))
            this._defaultImports = null
        }
    },
    /**
     * @returns {Array}
     */
    getFiles: function() {
        var files = [], self = this
        if (this._allfiles) return this._allfiles
        this._data.files.forEach(function(item) {
            var isRemove = false
            if (item.charAt(0) === "^") {
                isRemove = true
                item = item.slice(1)
            }
            var _files = glob.sync(item, {
                "cwd": self._path
            })
            if (!isRemove) {
                files = _.union(files, _files)
            } else {
                files = _.without.apply(_, [files].concat(_files))
            }
        })
        files = _.without.apply(_, [files, "package.js"].concat(self.getTestFiles()))
        this._allfiles = files
        return files
    },
    getTestFiles: function() {
        var files = [], self = this
        if (this._testfiles) return this._testfiles
        this._data.test_files.forEach(function(item) {
            if (/^[.A-Za-z0-9_\/\-]+$/.test(item) && !fs.existsSync(path.join(self._path, item))) {
                console.warn(self._msg("not found test file: " + item))
            }
            var isRemove = false
            if (item.charAt(0) === "^") {
                isRemove = true
                item = item.slice(1)
            }
            var _files = glob.sync(item, {
                "cwd": self._path
            })
            if (!isRemove) {
                files = _.union(files, _files)
            } else {
                files = _.without.apply(_, [files].concat(_files))
            }
        })
        files = this._testfiles = _.without(files, "package.js")
        return files
    },
    getFilesSplitingByExtname: function(hasTest) {
        var files = this.getFiles()
        var ret = {}
        if (hasTest)
            files = files.concat(this.getTestFiles())
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
        //load default Package.js
        var defaultPackagePath = path.join(this._path, "..", "package.js")
        if (fs.existsSync(defaultPackagePath)) {
            this._execDefault = true
            util.execFileByContext(defaultPackagePath, {Package: this})
            this._execDefault = false
        }
        //load Package.js
        var packagePath = path.join(this._path, "package.js")
        if (fs.existsSync(packagePath)) {
            util.execFileByContext(packagePath, {Package: this})
        } else {
            //console.warn("can not find package.js in \"" + this._family + "/" + this._name + "\"")
        }
    },
    _addDefaultImports: function(_items) {
        if (!this._defaultImports) this._defaultImports = []
        var items = this._getFullnameArr(_items)
        this._defaultImports = this._defaultImports.concat(items)
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