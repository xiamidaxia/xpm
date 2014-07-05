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
        var ex = /^([^\/\.]+)\/([^\/]+)(.*)$/.exec(_path)
        if (!ex) throw new Error('require param "'+_path+'" is uncorrect!')
        var self = this
        var p = this.addPackage(ex[1], ex[2])
        var ismain = false
        if (!ex[3] || ex[3] == "" || ex[3] == "/") {
            ismain = true
        }
        return self._execFile({
            family: p._family,
            packname: p._name,
            path: path.join(self._cwd, _path),
            ismain: ismain
        }).ret
    },
    /**
     * @param family
     * @param packageName
     * @returns {Object}
     */
    addPackage: function(family, packageName) {
        var self = this
        var p, fullname, context = {}
        fullname = path.join(family, packageName)
        if (this._map[fullname]) return this._map[fullname]
        p = Xpm.prototype.addPackage.apply(this, arguments)
        p._data.require.forEach(function(pname) {
            self._map[pname].exportsToContext(context)
        })
        p.execServer(context)
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
        var family = pathDetail.family
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
            throw new Error(p._msg("未加入文件：" + curpath))
        }
        //console.log(curpath)
        //设定require
        _context.require = function(pathStr) {
            var nativeRet, _detail, fullname, curfullname
            if (nativeRet = self._checkNativeRequire(pathStr, curpath)) {
                return nativeRet
            }
            _detail = self._getRequirePathDetail(pathStr, curpath)
            curfullname = p._family + "/" + p._name
            fullname = _detail.family + "/" + _detail.packname
            //检测imports
            if (_detail.family !== family && !~p._data.imports.indexOf(_detail.family))
                throw new Error(p._msg("unimport family: '" + _detail.family + "'"))
            //检测require是否包含
            if (curfullname !== fullname && !~p._data.require.indexOf(fullname)) {
                throw new Error(p._msg("unrequire: " + fullname))
            }
            return self._execFile(_detail).ret
        }
        return p._fileCache[relativepath] = util.execFileByContext(curpath, _context, true)
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
     * @param {String} 当前的文件绝对路径
     */
    _getRequirePathDetail: function(pathStr, curfilepath) {
        var self = this
        var realpath, familypath, relativepath, dirpath, details, curdetails
        var standard_reg = /^([^\/]+)\/([^\/]+)\/(.+)/
        curdetails = standard_reg.exec(path.relative(self._cwd, curfilepath))
        var ismain
        if (pathStr.charAt(0) === ".") {
            // "./file1.js" or "../file1.js"
            dirpath = path.dirname(curfilepath)
            realpath = path.join(dirpath, pathStr)
        } else if (pathStr.charAt(0) === "/") {
            throw new Error("[" + curfilepath + "] require('" + pathStr + "') 不能使用根路径.")
        } else if (pathStr.charAt(0) === "@" && pathStr.charAt(1) === "/") {
            // "@/family/pack/file1.js" or "@/family/pack"
            realpath = path.join(self._cwd, pathStr.replace("@", ""))
        } else {
            //  "pack/file1.js" or just only "pack"
            familypath = path.join(self._cwd, curdetails[1])
            realpath = path.join(familypath, pathStr)
        }
        relativepath = path.relative(self._cwd, realpath)
        if (/^\.\.\/.*/.test(relativepath))
            throw new Error("[" + curfilepath + "] require('" + pathStr + "') 超出了工作路径.")
        details = relativepath.split('/')
        if (!details[1])
            throw new Error("[" + curfilepath + "] require('" + pathStr + "') 不合法.")
        if (relativepath.split("/").length === 2) {
            ismain = true
        }
        return {
            family: details[0],
            packname: details[1],
            path: realpath,
            ismain: ismain
        }
    },
    test: function(testArr, mochaOpts) {
        require("./xpm_tester")(this, testArr, mochaOpts)
    }
})

module.exports = XpmServer
