/**
 *  Xiami Package Manager (XPM) Client Model.
 *
 *  @author liuwencheng [xiamidaxia@gmail.com]
 *
 */
var Package = require('./Package')
var _ = require('underscore')
var path = require('path')
var fs = require('fs')
var gulp = require('gulp')

var Xpm = require('./Xpm')
var clean = require('gulp-clean')
var SUPPORT_PLUGIN_TYPE = ['stylesheet', 'javascript', 'template', 'image']
/**
 * @public
 * @param {Object} config
 *      {
 *          "cwd": {String} 工作目录
 *          "dest": {String} 编译后的目标目录,
 *          "plugins": {Array} [{Object}...]
 *               eg: [{
 *                  "type": "stylesheet",
 *                  "extnames": ['css'],
 *                  "through": function(stream, package, xpm) {
 *                      return stream.pipe(require('gulp-cssmin')())
 *                  }
 *               }]
 *      }
 */
function XpmClient(config) {
    Xpm.call(this, config)
    try {
        this._dest = fs.realpathSync(config.dest)
    } catch (e) {
        throw new Error('unknown xpm dest path: ' + config.dest)
    }
    this._type = "client"
    this._plugins = {}
    this._loadPlugins(config.plugins)
}
require('util').inherits(XpmClient, Xpm)
_.extend(XpmClient.prototype, {
    _loadPlugins: function(plugins) {
        var self = this
        //loadDefaultPlugins
        SUPPORT_PLUGIN_TYPE.forEach(function(typename) {
            self._plugins[typename] = require('./types/' + typename)
        })
        plugins && plugins.forEach(function(p) {
            if (!~SUPPORT_PLUGIN_TYPE.indexOf(p.type)) throw new Error('unsupport plugin type: ' + p.type)
            self._plugins[p.type] = p
        })
    },
    /**
     * @param {Array} ["meteor", "packages"...]
     * @param {Object | Ignore}
     *      {
     *          "meteor": ['livedata','deps'...]
     *      }
     */
    add: function(families, ignores) {
        var self = this
        ignores = ignores || {}
        families.forEach(function(family) {
            fs.readdirSync(path.join(self._cwd, family)).forEach(function(packname) {
                if (ignores[family] && ~ignores[family].indexOf(packname)) return
                var realpath = path.join(self._cwd, family, packname)
                if (fs.statSync(realpath).isDirectory() && fs.existsSync(path.join(realpath, "package.js"))) {
                    self.addPackage(family, packname)
                }
            })
        })
    },
    /**
     * @param family
     * @param packageName
     * @returns {Object}
     */
    addPackage: function(family, packageName) {
        var p, allfiles, fullname,destpath, self = this, streams = {}
        fullname = path.join(family, packageName)
        if (this._map[fullname]) return this._map[fullname]

        p = Xpm.prototype.addPackage.apply(this, arguments)
        destpath = path.join(self._dest, fullname)
        allfiles = p.getFilesSplitingByExtname()
        //clean
        gulp.src(path.join(self._dest, fullname)).pipe(clean())
        //compile static types
        _.each(self._plugins, function(plugin, type) {
            var curFiles = []
            if (type === 'javascript') return
            plugin.extnames.forEach(function(extname) {
                if (allfiles[extname]) curFiles = curFiles.concat(allfiles[extname])
            })
            if (curFiles.length === 0) return
            streams[type] =
                plugin.through(gulp.src(curFiles, {"cwd": p._path}), p, self)
                .pipe(gulp.dest(destpath))
            //if (type == 'image') streams[type].pipe(gulp.dest(destpath))
        })
        //compile javascript type
        return p
    },
    /**
     * 更新包
     * @param family
     * @param packageName
     * @returns {Object}
     */
    updatePackage: function(family, packageName) {
        var fullname = path.join(family, packageName)
        if (this._map[fullname]) delete this._map[fullname]
        return this.addPackage(family, packageName)
    }
})

module.exports = XpmClient
