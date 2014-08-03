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
var rimraf = require('rimraf')
var mkdirp = require('mkdirp')

var Xpm = require('./Xpm')
var watcher = require('./watcher')
var SUPPORT_PLUGIN_TYPES = ['image', 'stylesheet', 'template', 'javascript','coffee']
var tpl = require('handlebars').compile(fs.readFileSync(__dirname + "/script.tpl").toString())
/**
 * @public
 * @param {Object} config
 *      {
 *          "dest": {String} 编译后的目标目录
 *          "production": {Boolean} 是否为生产环境
 *          "family": {Object} family path map
 *              eg: {
 *                      "meteor": __dirname + "/meteor",
 *                      "xiami": __dirname + "/xiami"
 *                  }
 *      }
 */
function XpmClient(config) {
    Xpm.call(this, config)
    this._dest = config.dest
    this._type = "client"
    this._plugins = []
    this._loadPlugins()
    this._cleanDest()
    this._createXpmFile()
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
    _cleanDest: function() {
        //clean dest
        rimraf.sync(this._dest)
        //create dest
        mkdirp.sync(this._dest)
    },
    _createXpmFile: function() {
        var content = ""
        var _start = ";(function() {\n\n"
        var _end = "\n})()\n"
        var _wrapStart = '\n_wrapModule("{{name}}", function(require, exports, module) {\n'
        var _wrapEnd = "\n})\n"
        content += fs.readFileSync(path.join(__dirname, "browser/__cmd.js")).toString()
        content = content
            + _wrapStart.replace("{{name}}", "path")
            + fs.readFileSync(path.join(__dirname, "browser/native/path.js")).toString()
            + _wrapEnd
        content = content
            + _wrapStart.replace("{{name}}","xpm")
            + fs.readFileSync(path.join(__dirname, "browser/xpm_browser.js")).toString()
            + _wrapEnd
        var buf = new Buffer(_start + content + _end)
        fs.writeFileSync(path.join(this._dest, "xpm.js"), buf)
    },
    /**
     * @param {Array}
     *      eg: ["meteor/*", "xiami/deps"...]
     * @param {Function | Ignore}
     *      loaded callback
     */
    add: function(packageArr, cb) {
        var self = this
        var addingPackages = []
        self.on('added', function(pack) {
            addingPackages = _.without(addingPackages, pack)
            if (addingPackages.length === 0) {
                self.emit('all-added')
            }
        })
        self.once('all-added', function() {
            cb && cb()
        })
        packageArr.forEach(function(item) {
            item = item.split("/")
            if (item.length !== 2)
                throw new Error("Xpmclient.add params uncorrect: " + packageArr)
            if (item[1] === "*") {
                var fmpath = self.getFamilyPath(item[0])
                fs.readdirSync(fmpath).forEach(function(packname) {
                    var realpath = path.join(fmpath, packname)
                    if (fs.statSync(realpath).isDirectory() &&fs.existsSync(path.join(realpath, "package.js")) ) {
                        addingPackages.push(path.join(item[0], packname))
                        self.addPackage(item[0], packname)
                    }
                })
            } else {
                addingPackages.push(path.join(item[0], item[1]))
                self.addPackage(item[0], item[1])
            }
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
        //clean this package directory
        rimraf.sync(path.join(self._dest, fullname))
        //compile static types
        self._plugins.forEach(function(plugin) {
            var stream
            var curFiles = []
            plugin.extnames.forEach(function(extname) {
                if (allfiles[extname]) curFiles = curFiles.concat(allfiles[extname])
            })
            if (curFiles.length === 0) return
            //add file type to file cache
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
            var browser_path = path.relative(p._path, file.path)
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
            var requires
            requires = p._data.imports.map(function(item) {
                return '"' + item + '"'
            })
            templateData.family = p._family
            templateData.name = p._name
            templateData.requireStr = requires.join(',')
            templateData.mainpath = p._data.main
            var newFile = new gulpUtil.File({
                cwd: p._path,
                base: p._path,
                path: path.join(p._path, 'index.js'),
                contents: new Buffer(tpl(templateData))
            })
            this.push(newFile)
            next()
        })).pipe(gulp.dest(destpath).on('end', function() {
            self.emit('added', fullname)
        }))
    },
    delPackage: function(family, packageName) {
        var fullname = family + "/" + packageName
        if (this._map[fullname]) {
            console.log('delete package: ' + fullname)
            delete this._map[fullname]
            rimraf.sync(path.join(self._dest, fullname))
        }
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
        if (this._map[fullname]) {
            delete this._map[fullname]
        }
        console.log('update package: ' + fullname)
        return this.addPackage(family, packageName)
    },
    /**
     * watch file changed, auto update package
     */
    watch: function() {
        var self = this
/*        watcher(self._cwd, function(filepath, e) {
            var _p = path.relative(self._cwd, filepath).split(path.sep)
            if (_p.length>=3) {
                //change package
                if (fs.existsSync(path.join(self._cwd, _p[0], _p[1], "package.js"))) {
                    self.updatePackage(_p[0], _p[1])
                }
            } else if (_p.length>=2 && _p[_p.length -1] === "package.js") {
                //update family
                _.each(self._map, function(item, key) {
                    key = key.split["/"]
                    if (key[0] === _p[0]) {
                        self.updatePackage(key[0], key[1])
                    }
                })
            }
        }, [/node_modules/])*/
    }
})
module.exports = XpmClient
