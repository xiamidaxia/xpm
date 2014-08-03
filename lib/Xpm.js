/**
 *  Xiami Package Manager (XPM).
 *
 *  @author liuwencheng [xiamidaxia@gmail.com]
 *
 */
var Package = require('./Package')
var sequency = require('sequencify')
var _ = require('underscore')
var path = require('path')
var fs = require('fs')
var gutil = require('gulp-util')
var EventEmitter = require('events').EventEmitter
gutil.colors.enabled = true
/**
 * @public
 * @param {Object} config
 *      {
 *          "production": {Boolean} 是否为生产环境
 *          "family": {Object} family path map
 *      }
 */
function Xpm(config) {
    EventEmitter.apply(this, arguments)
    config = config || {}
    this._familyMap = {} //families work dir map
    this._production = config.production || false
    this._type  //'client' or 'server'
    this._map = {}
    if (config.family) {
        this.addFamily(obj)
    }
}
require('util').inherits(Xpm, EventEmitter)
_.extend(Xpm.prototype, {
    /**
     * @param obj
     *      {
     *          meteor: __dirname + "/meteor",
     *          xiami: __dirname + "/xiami"
     *      }
     */
    addFamily: function(obj) {
        var self = this
        _.each(obj, function(val, key){
            try {
                var _real = fs.realpathSync(val)
            } catch(e){
                throw new Error('xpm family `'+ key +'` unknow path: ' + val)
            }
            self._familyMap[key] = _real
        })
    },
    getFamilyPath: function(familyName) {
        if (!this._familyMap[familyName]) {
            throw new Error("unknow family name: " + familyName)
        }
        return this._familyMap[familyName]
    },
    /**
     * @param family
     * @param packageName
     * @returns {Object}
     */
    addPackage: function(family, packageName) {
        var p, fullname, self = this
        fullname = path.join(family, packageName)
        if (this._map[fullname]) return this._map[fullname]

        p = self._map[fullname] = new Package({
            path: path.join(self.getFamilyPath(family), packageName),
            type: self._type
        })
        //add test imports
        if (!this._production) p._data.imports = p._data.imports.concat(p._data.test_imports)
        //add the imports packages
        p._data.imports.forEach(function(pname) {
            pname = pname.split('/')
            self.addPackage(pname[0], pname[1])
        })
        //此处用于检测是否有循环依赖, 在生产环境下这一步可以去掉
        if (!this._production) this._checkPackageSequency(p, p._data.imports)
        return p
    },
    _checkPackageSequency: function(packageObj, requireArr) {
        var result = [], items = {}, self = this
        _.each(self._map, function(_pack, _packname) {
            items[_packname] = {
                name: _packname,
                dep: _pack._data.imports
            }
        })
        sequency(items, requireArr, result)
        return result
    },
    /**
     * @param {String} 路径字符串
     * @param {String | Ignore} current relative path
     * @param {String | Ignore} current package
     */
    _getRequirePathDetail: function(pathStr, curRelativepath, p) {
        var realpath, relativepath, details, ismain, family, packname,dirpath
        //var standard_reg = /^[^\/\.]+\/[^\/\.]+.*$/
        var _throw = function(str) {
            if (p) {
                throw new Error(p._msg("[" + curRelativepath + "] require('" + pathStr + "'): " + str))
            } else {
                throw new Error("require('" + pathStr + "'): " + str)
            }
        }
        if (!p && pathStr.charAt(0) === ".") {
            _throw("can not use '.' or '..' out of package" )
        } else if (pathStr.charAt(0) === "/") {
            _throw("can not use root path.")
        } else if (pathStr.charAt(0) === ".") {
            dirpath = path.dirname(curRelativepath)
            realpath = path.join(p._path, dirpath, pathStr)
            relativepath = path.relative(p._path, realpath)
            if (relativepath.charAt(0) === ".")
                _throw ("outer current package workspace.")
            ismain = relativepath === ""
            family = p._family
            packname = p._name
        } else {
            details = pathStr.split('/')
            if (details.length < 2 ) _throw ("uncorrect.")
            family = details[0]
            packname = details[1]
            details.shift()
            details.shift()
            relativepath = details.join("/")
            if (details.length === 0 || (details.length === 1 && details[0] === "")) {
                ismain = true
                relativepath = ""
            }
        }
        return {
            family: family,
            packname: packname,
            path: relativepath,
            ismain: ismain || false
        }
    }
})

module.exports = Xpm

