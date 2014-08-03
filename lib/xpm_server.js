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
var util = require('./util')

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
     *
     * @param {String} path  "family/pack" or "family/pack/path.js"
     * @returns {*}
     */
    require: function(_path) {
        var self = this
        var detail = self._getRequirePathDetail(_path)
        return self._execFile(detail).ret
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
        p = Xpm.prototype.addPackage.apply(this, arguments)
        if (p._data.main_preload) {
            //exec main file when creating package
            self.require(fullname)
        }
        return p
    },
    /*
     * 执行指定的路径
     * @param {Object} 路径详情
     */
    _execFile: function(pathDetail) {
        var self = this
        var p = self.addPackage(pathDetail.family, pathDetail.packname)
        var _context = _.clone(p._context || {})
        var curpath = pathDetail.path
        var relativepath
        //is main file
        if (pathDetail.ismain)
            curpath = p._mainpath
        if (path.extname(curpath) === "") curpath = curpath + ".js"
        relativepath = path.relative(p._path, curpath)
        //读取缓存
        if (p._fileCache[relativepath]) return p._fileCache[relativepath]
        //检测文件是否已经加入
        if (!~p._allfiles.indexOf(relativepath)) {
            throw new Error(p._msg("not add file：" + curpath))
        }
        //设定require
        _context.require = function(pathStr, isNative) {
            var nativeRet, _detail, fullname, curfullname
            if (isNative) {
                return util.getRequireFn(curpath)(pathStr)
            }
            if (nativeRet = self._checkNativeRequire(pathStr, curpath)) {
                return nativeRet
            }
            _detail = self._getRequirePathDetail(pathStr, curpath)
            curfullname = p._family + "/" + p._name
            fullname = _detail.family + "/" + _detail.packname
            //检测imports是否包含
            if (curfullname !== fullname && !~p._data.imports.indexOf(fullname)) {
                throw new Error(p._msg("no import: " + fullname))
            }
            return self._execFile(_detail).ret
        }
        return p._fileCache[relativepath] = util.execFileByContext(curpath, _context, true) || {}
    },
    _checkNativeRequire: function(pathStr, curpath) {
        if (!/^[^\/]+$/.test(pathStr)) return false
        try {
            return util.getRequireFn(curpath)(pathStr)
        } catch (e) {
            return false
        }
    },
    /**
     * [server]
     * @param {String} 路径字符串
     * @param {String | Ignore} 当前的文件绝对路径
     */
    _getRequirePathDetail: function(pathStr, curfilepath) {
        var self = this
        var realpath, relativepath, dirpath, details, ismain
        var standard_reg = /^([^\/\.]+)\/([^\/\.]+)\/*(.*)$/
        if (!curfilepath && pathStr.charAt(0) === ".") {
            throw new Error("require('" + pathStr + "'): can not use '.' or '..' out of package" )
        } else if (pathStr.charAt(0) === ".") {
            dirpath = path.dirname(curfilepath)
            realpath = path.join(dirpath, pathStr)
        } else if (pathStr.charAt(0) === "/") {
            throw new Error("[" + curfilepath + "] require('" + pathStr + "'): can not use root path.")
        } else if (standard_reg.exec(pathStr)) {
            realpath = path.join(self._cwd, pathStr)
        } else {
            throw new Error("[" + curfilepath + "] require('" + pathStr + "'): uncorrect.")
        }
        relativepath = path.relative(self._cwd, realpath)
        if (/^\.\.\/.*/.test(relativepath))
            throw new Error("[" + curfilepath + "] require('" + pathStr + "'): outer workspace.")
        details = relativepath.split('/')
        if (!details[1])
            throw new Error("[" + curfilepath + "] require('" + pathStr + "'): uncorrect.")
        if (relativepath.split("/").length === 2) {
            ismain = true
        }
        return {
            family: details[0],
            packname: details[1],
            path: realpath,
            ismain: ismain || false
        }
    },
    test: function(testArr, mochaOpts) {
        require("./xpm_tester")(this, testArr, mochaOpts)
    }
})

module.exports = XpmServer