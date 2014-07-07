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
var through2 = require('through2')
var gulpUtil = require('gulp-util')
var clean = require('gulp-clean')

var Xpm = require('./Xpm')
var SUPPORT_PLUGIN_TYPES = ['image', 'stylesheet', 'template', 'javascript']
var tpl = require('handlebars').compile(fs.readFileSync(__dirname + "/script.tpl").toString())
/**
 * @public
 * @param {Object} config
 *      {
 *          "cwd": {String} 工作目录
 *          "dest": {String} 编译后的目标目录
 *      }
 */
function XpmClient(config) {
    Xpm.call(this, config)
    this._dest = config.dest
    this._type = "client"
    this._plugins = []
    this._loadPlugins()
    this.cleanDest()
}
require('util').inherits(XpmClient, Xpm)
_.extend(XpmClient.prototype, {
    _loadPlugins: function() {
        var self = this
        //loadDefaultPlugins
        SUPPORT_PLUGIN_TYPES.forEach(function(typename) {
            self._plugins.push(require('./types/' + typename))
        })
    },
    cleanDest: function() {
        gulp.src(path.join(this._dest), {read: false}).pipe(clean())
    },
    /**
     * @param {Array} ["meteor", "packages"...]
     * @param {Object | Ignore}
     *      {
     *          "meteor": ['livedata','deps'...]
     *      }
     */
    add: function(families, ignores, cb) {
        var self = this
        var addingPackages = []
        ignores = ignores || {}
        self.on('added', function(pack) {
            addingPackages = _.without(addingPackages, pack)
            if (addingPackages.length === 0) {
                self.emit('all-added')
            }
        })
        self.once('all-added', function() {
            cb && cb()
        })
        families.forEach(function(family) {
            fs.readdirSync(path.join(self._cwd, family)).forEach(function(packname) {
                if (ignores[family] && ~ignores[family].indexOf(packname)) return
                var realpath = path.join(self._cwd, family, packname)
                if (fs.statSync(realpath).isDirectory() && fs.existsSync(path.join(realpath, "package.js"))) {
                    addingPackages.push(path.join(family, packname))
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
        var p, allfiles, fullname, self = this, streams = []
        fullname = path.join(family, packageName)
        if (this._map[fullname]) return this._map[fullname]

        p = Xpm.prototype.addPackage.apply(this, arguments)
        allfiles = p.getFilesSplitingByExtname()
        if (_.isEmpty(allfiles)) {
            self.emit('added', fullname)
            return p
        }
        //clean
        gulp.src(path.join(self._dest, fullname), {read: false}).pipe(clean())
        //compile static types
        self._plugins.forEach(function(plugin) {
            var stream
            var curFiles = []
            plugin.extnames.forEach(function(extname) {
                if (allfiles[extname]) curFiles = curFiles.concat(allfiles[extname])
            })
            if (curFiles.length === 0) return
            stream = gulp.src(curFiles, {"cwd": p._path}).pipe(
                through2.obj(function(file, enc, next) {
                    file.type = plugin.type
                    this.push(file)
                    next()
                }))
            stream = plugin.through(stream, streams, p, self)
            streams.push(stream)
        })
        this._renderStreams(streams, p)
        return p
    },
    /**
     *  render and concat to javascript file
     *
     * @param {Array} streams
     * @param {Object} packageObj
     * @private
     */
    _renderStreams: function(streams, p) {
        var self = this
        var es = require('event-stream')
        var cache = {}
        var fullname = path.join(p._family, p._name)
        var destpath = path.join(self._dest, fullname)
        //catch static types
        es.merge.apply(es, streams).pipe(through2.obj(function(file, enc, next) {
            var browser_path = path.relative(path.join(self._cwd, fullname), file.path)
            if (!cache[file.type]) cache[file.type] = []
            //buffer the files
            cache[file.type].push({
                path: browser_path,
                content: file.contents.toString()
            })
            if (file.type === "image") this.push(file)
            next()
        }, function(next) {
            var templateData = cache
            templateData.family = p._family
            templateData.name = p._name
            templateData.requireStr = '"meteor/agagag","ggg/agaga","gagag/gagag"'
            templateData.mainpath = "this/is/main/path"
            var newFile = new gulpUtil.File({
                cwd: path.join(self._cwd, fullname),
                base: path.join(self._cwd, fullname),
                path:  path.join(self._cwd, fullname, 'index.js'),
                contents: new Buffer(tpl(templateData))
            })
            this.push(newFile)
            next()
        })).pipe(gulp.dest(destpath).on('end', function() {
            self.emit('added', fullname)
        }))
    },
    /**
     *  update package
     *
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
