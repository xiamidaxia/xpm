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
var prettyCode = require('./prettyCode')
var handlebars = require('handlebars')
var tpl = handlebars.compile(fs.readFileSync(__dirname + "/script.tpl").toString())
/**
 * @public
 * @param {Object} config
 *      {
 *          "dest": {String} final dest path
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
    if (!config.dest)
        throw new Error("XpmClient need to config `dest` path.")
    this._dest = config.dest
    this._type = "client"
    this._plugins = {}
    this._readyPackages = []
    this._testPackages = []
    this._testOpts = {
        ui: "bdd",
        reporter: "html",
        timeout: 1200,
        bail: false,
        test: "assert"
    }
    this._loadDefaultPlugins()
}
require('util').inherits(XpmClient, Xpm)
_.extend(XpmClient.prototype, {
    _loadDefaultPlugins: function() {
        var self = this
        fs.readdirSync(__dirname + "/plugins").forEach(function(plugin) {
            plugin = require('./plugins/' + plugin)
            if (plugin.tpl)
                plugin.tpl = handlebars.compile(plugin.tpl)
            self._plugins[plugin.type] = plugin
        })
    },
    /**
     * add stream plugin
     *
     * @param {Object} pluginObj
     */
    addPlugin: function(plugin) {
        if (plugin.tpl)
            plugin.tpl = handlebars.compile(plugin.tpl)
        this._plugins[plugin.type] = plugin
    },
    /**
     * render added packages
     */
    run: function(cb) {
        var self = this
        self._cleanDest()
        self._createXpmFile()
        self.on('added', function(pack) {
            self._readyPackages = _.without(self._readyPackages, pack)
            if (self._readyPackages.length === 0) {
                self.emit('all-added')
            }
        })
        self.once('all-added', function() {
            cb && cb()
        })
        //add test package
        if (self._testPackages.length !== 0) {
            self.addPackage("xpm", "chai")
            self.addPackage("xpm", "mocha")
        }
        self._readyPackages.forEach(function(packname) {
            packname = packname.split('/')
            self.addPackage(packname[0], packname[1])
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
        var defaultNatives = ["json2", "es5-shim", "util", 'path', 'events', "xpm"]
        content += fs.readFileSync(path.join(__dirname, "browser/__cmd.js")).toString()
        //add native
        defaultNatives.forEach(function(native) {
            content = content
                + _wrapStart.replace("{{name}}", native)
                + prettyCode(native, fs.readFileSync(path.join(__dirname, "browser/native/" + native + ".js")).toString())
                + _wrapEnd
        })
        if (this._testPackages.length !== 0) {
            var testType = this._testOpts.test
            var mochaOpts = _.clone(this._testOpts)
            delete mochaOpts.test
            content = content
                + _start
                + 'xpm.use(["xpm/chai","xpm/mocha"], function(chai, mocha) {\n'
                + '    chai("' + testType + '")\n'
                + '    mocha.setup(' + JSON.stringify(mochaOpts) + ')\n'
                + '    xpm.use(' + JSON.stringify(this._testPackages) + ', function(){mocha.run()})\n'
                + '})'
                + _end
        }
        var buf = new Buffer(_start + content + _end)
        fs.writeFileSync(path.join(this._dest, "xpm.js"), buf)
    },
    /**
     * @param {Array}
     *      eg: ["meteor/*", "xiami/deps"...]
     */
    add: function(packageArr, opts) {
        var self = this
        var addingPackages = this._readyPackages
        packageArr.forEach(function(item) {
            item = item.split("/")
            if (item.length !== 2)
                throw new Error("Xpmclient.add params uncorrect: " + packageArr)
            if (item[1] === "*") {
                var fmpath = self.getFamilyPath(item[0])
                fs.readdirSync(fmpath).forEach(function(packname) {
                    var realpath = path.join(fmpath, packname)
                    if (fs.statSync(realpath).isDirectory()) {
                        addingPackages.push(path.join(item[0], packname))
                    }
                })
            } else {
                addingPackages.push(path.join(item[0], item[1]))
            }
        })
    },
    _isTest: function(fullname) {
        return this._testPackages.indexOf(fullname) !== -1
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
        console.log('add package: ' + fullname)
        if (!self._isTest(fullname)) {
            allfiles = p.getFilesSplitingByExtname()
        } else {
            allfiles = p.getFilesSplitingByExtname(true)
        }
        if (_.isEmpty(allfiles)) {
            self.emit('added', fullname)
            return p
        }
        //clean this package directory
        rimraf.sync(path.join(self._dest, fullname))
        //compile static types
        _.each(self._plugins, function(plugin) {
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
                    file.base = p._path
                    this.push(file)
                    next()
                }))
            stream = plugin.through(stream, p, self)
            if (plugin.pretty) {
                stream.pipe(
                    through2.obj(function(file, enc, next) {
                        file.type = plugin.type
                        var filename = path.relative(file.base, file.path)
                        file.contents = new Buffer(prettyCode(filename, file.contents.toString()))
                        this.push(file)
                        next()
                }))
            }
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
            cache[file.type].push(_.extend({}, file, {
                path: browser_path,
                contents: file.contents.toString()
            }))
            if (file.type === "image") {
                this.push(file)
            }
            next()
        }, function(next) {
            var templateData = {}
            var codes = []
            var requires
            _.each(cache, function(items, pluginname) {
                if (items.length !== 0) {
                    var _tpl = self._plugins[pluginname].tpl
                    items.forEach(function(item) {
                        codes.push(_tpl(item))
                    })
                }
            })
            requires = p._data.imports.map(function(item) {
                return '"' + item + '"'
            })
            templateData.family = p._family
            templateData.name = p._name
            templateData.codes = codes.join("")
            templateData.requireStr = requires.join(',')
            templateData.mainpath = p._data.main
            templateData.main_preload = p._data.main_preload
            templateData.all_preload = p._data.all_preload
            if (self._isTest(fullname))
                templateData.testFiles = JSON.stringify(p.getTestFiles())
            var newFile = new gulpUtil.File({
                cwd: p._path,
                base: p._path,
                path: path.join(p._path, p._family + '-' + p._name + '.js'),
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
        _.each(self._familyMap, function(familypath, familyname) {
            watcher(familypath, function(filepath) {
                try {
                    var _p = path.relative(familypath, filepath).split(path.sep)
                    var packagename
                    if (_p.length >= 2) {
                        //change package
                        packagename =  _p[0]
                        if (fs.statSync(path.join(familypath, packagename)).isDirectory()) {
                            self.updatePackage(familyname, packagename)
                        }
                    } else if (_p.length === 1 && _p[0] === "package.js") {
                        //update all packages
                        _.each(self._map, function(pack, key) {
                            key = key.split("/")
                            packagename = key[1]
                            if (key[0] === familyname  && fs.statSync(path.join(familypath, packagename)).isDirectory()) {
                                self.updatePackage(familyname, packagename)
                            }
                        })
                    }
                } catch (e) {
                    console.error(e.stack)
                }
            })
        })
    },
    test: function(packageArr, opts) {
        this._testPackages = this.getFullPackages(packageArr)
        this._testOpts = _.extend(this._testOpts, opts)
    }
})
module.exports = XpmClient
