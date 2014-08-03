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
 *          "production": {Boolean} 是否为生产环境
 *          "family": {Object} family path map
 *              eg: {
 *                      "meteor": __dirname + "/meteor",
 *                      "xiami": __dirname + "/xiami"
 *                  }
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
        var realpath, curpath
        //is main file
        if (!pathDetail.ismain) {
            curpath = pathDetail.path
        } else {
            curpath = p._mainpath
        }
        realpath = path.join(p._path, curpath)
        if (path.extname(curpath) === "") {
            realpath = realpath + ".js"
            curpath = curpath + ".js"
        }
        //读取缓存
        if (p._fileCache[curpath]) return p._fileCache[curpath]
        //检测文件是否已经加入
        if (!~p._allfiles.indexOf(curpath)) {
            throw new Error(p._msg("not add file：" + curpath))
        }
        //设定require
        _context.require = function(pathStr, isNative) {
            var nativeRet, _detail, fullname, curfullname
            if (isNative) {
                return util.getRequireFn(realpath)(pathStr)
            }
            if (nativeRet = self._checkNativeRequire(pathStr, realpath)) {
                return nativeRet
            }
            _detail = self._getRequirePathDetail(pathStr, curpath, p)
            curfullname = p._family + "/" + p._name
            fullname = _detail.family + "/" + _detail.packname
            //检测imports是否包含
            if (curfullname !== fullname && !~p._data.imports.indexOf(fullname)) {
                throw new Error(p._msg("no import: " + fullname))
            }
            return self._execFile(_detail).ret
        }
        return p._fileCache[curpath] = util.execFileByContext(realpath, _context, true) || {}
    },
    _checkNativeRequire: function(pathStr, curpath) {
        if (!/^[^\/]+$/.test(pathStr)) return false
        try {
            return util.getRequireFn(curpath)(pathStr)
        } catch (e) {
            return false
        }
    },
    test: function(testArr, mochaOpts) {
        require("./xpm_tester")(this, testArr, mochaOpts)
    }
})

module.exports = XpmServer
