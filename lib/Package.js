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
        _.each(data, function(items, key) {
            switch (key) {
                case "imports":
                case "test_imports":
                case "files":
                case "test_files":
                    assertType(items, "Array | String", self._msg("key '" + key + "' need an Array or String."))
                    if (typeof items === "string") items = [items]
                    if (key === "imports" || key === "test_imports") {
                        self._addImports(items, key)
                    } else {
                        self._data[key] = _.union(self._data[key] || [], items )
                    }
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
    _addImports: function(items, key) {
        var self = this
        var importArr = this._data[key] || []
        items.forEach(function(name) {
            var isRemove
            if (name.charAt(0) === "^") {
                name = name.slice(1)
                isRemove = true
            }
            if (/^[^\/]+$/.test(name)) {
                name = self._family + "/" + name
            }
            if (!isRemove) {
                importArr.push(name)
            } else {
                importArr = _.without(importArr, name)
            }
        })
        //without self
        importArr = _.without(importArr, self._family + "/" + self._name)
        self._data[key] = _.union(importArr)
    },
    /**
     *
     */
    _config: function() {
        var self = this
        //set allfiles
        this._allfiles = this.getFiles()
        //set mainpath
        this._mainpath = self._data.main
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
            util.execFileByContext(defaultPackagePath, {Package: this})
        }
        //load Package.js
        var packagePath = path.join(this._path, "package.js")
        if (fs.existsSync(packagePath)) {
            util.execFileByContext(packagePath, {Package: this})
        } else {
            //console.warn("can not find package.js in \"" + this._family + "/" + this._name + "\"")
        }
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