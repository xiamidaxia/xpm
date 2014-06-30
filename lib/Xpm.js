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
gutil.colors.enabled = true
/**
 * @public
 * @param {Object} config
 *      {
 *          "cwd": {String} 工作目录
 *          "production": {Boolean} 是否为生产环境
 *      }
 */
function Xpm(config) {
    this._cwd = fs.realpathSync(config.cwd)
    this._production = config.production
    this._type //'client' or 'server'
    this._map = {}
}
_.extend(Xpm.prototype, {
    /**
     * @param family
     * @param packageName
     * @returns {Object}
     */
    addPackage: function(family, packageName) {
        var p, fullname, self = this
        fullname = path.join(family, packageName)
        if (this._map[fullname]) return this._map[fullname]

        p = self._map[fullname] = new Package({path: path.join(this._cwd, fullname), type: self._type})
        p._data.imports.push(family)
        //add the require packages
        p._data.require.forEach(function(pname) {
            pname = pname.split('/')
            if (!~p._data.imports.indexOf(pname[0])) {
                throw new Error("package `"+fullname+"` need to imports: " + pname[0])
            }
            self.addPackage(pname[0], pname[1])
        })
        //此处用于检测是否有循环依赖, 在生产环境下这一步可以去掉
        if (!this._production) this._checkPackageSequency(p, p._data.require)
        return p
    },
    _checkPackageSequency: function(packageObj, requireArr) {
        var result = [], items = {}, self = this
        _.each(self._map, function(_pack, _packname) {
            items[_packname] = {
                name: _packname,
                dep: _pack._data.require
            }
        })
        sequency(items, requireArr, result)
        return result
    }
})


module.exports = Xpm

