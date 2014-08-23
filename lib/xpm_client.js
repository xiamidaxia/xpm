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
var crypto = require('crypto')

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
 *          "static_url": {String} 静态文件路径，用于转换css文件中的url路径
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
    this._config = _.extend({}, {
        static_url: "/static"
    },config)
    this._dest = config.dest
    this._type = "client"
    this._plugins = {}
    this._readyPackages = []
    this._testPackages = []
    //use to create manifest
    this._manifestMap = {}
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
                self._createManifestAndMap()
                self.emit('all-added')
                console.log('run success!')
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
        var p, allfiles
        var self = this
        var streams = []
        var fullname = path.join(family, packageName)
        var plugins = _.clone(self._plugins)
        var staticPlugins = {}
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
        //add static plugins
        _.each(plugins, function(plugin, name) {
            if (plugin.static) {
                staticPlugins[name] = plugin
                delete plugins[name]
            }
        })
        _.each(staticPlugins, function(plugin, name) {
            runPlugin(plugin, function() {
                delete staticPlugins[name]
                if (_.isEmpty(staticPlugins)) {
                    //compile other plugins
                    _.each(plugins, function(plugin) {
                        runPlugin(plugin)
                    })
                    self._renderStreams(streams, p)
                }
            })
        })
        /**
         * run plugin
         * @param plugin
         * @param staticCb : static plugin loaded callback
         */
        function runPlugin(plugin, staticCb) {
            var stream
            var curFiles = []
            plugin.extnames.forEach(function(extname) {
                if (allfiles[extname]) curFiles = curFiles.concat(allfiles[extname])
            })
            if (curFiles.length === 0) {
                staticCb && staticCb()
                return
            }
            //add file type to file cache
            stream = gulp.src(curFiles, {"cwd": p._path}).pipe(
                through2.obj(function(file, enc, next) {
                    file.type = plugin.type
                    file.base = p._path
                    this.push(file)
                    next()
                }))
            stream = plugin.through(stream, {
                config: self._config,
                package: p,
                xpm: self,
                plugin: plugin,
                streams: streams
            })
            if (plugin.pretty) {
                stream = stream.pipe(through2.obj(function(file, enc, next) {
                    var filename = path.relative(file.base, file.path)
                    file.contents = new Buffer(prettyCode(filename, file.contents.toString()))
                    this.push(file)
                    next()
                }))
            }
            if (plugin.static) {
                stream = stream.pipe(through2.obj(function(file, enc, next) {
                    file.static = true
                    this.push(file)
                    self.addToManifest(file, p)
                    next()
                }, function(next) {
                    next()
                    staticCb && staticCb()
                }))
            }

            streams.push(stream)
            return stream
        }
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
        //cache static file by types
        var streams = es.merge.apply(es, streams).pipe(through2.obj(function(file, enc, next) {
            var browser_path = path.relative(p._path, file.path)
            if (!cache[file.type]) cache[file.type] = []
            //copy the file
            cache[file.type].push(_.extend({}, file, {
                path: browser_path,
                contents: file.contents.toString()
            }))
            if (file.static) {
                this.push(file)
            }
            next()
        //merge as a js file
        }, function(next) {
            var templateData = {}
            var codes = []
            var requires
            _.each(cache, function(items, pluginname) {
                var _tpl = self._plugins[pluginname].tpl
                if (_tpl && items.length !== 0) {
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
            self.addToManifest(newFile, p)
            this.push(newFile)
            next()
        }))
        //only production
        if (self._production)
            streams = self._productionStream(streams)
        streams.pipe(gulp.dest(destpath).on('end', function() {
            self.emit('added', fullname)
        }))
    },
    /**
     * only use in production
     * @private
     */
    _productionStream: function(streams) {
        var uglify = require('gulp-uglify');
        var sourcemaps = require('gulp-sourcemaps')
        var notJsfileCache = []
        streams = streams
            .pipe(through2.obj(function(file, enc, next) {
                if (path.extname(file.path) == ".js") {
                    this.push(file)
                } else {
                    notJsfileCache.push(file)
                }
                next()
            }))
            .pipe(require('gulp-ngmin')())
            .pipe(sourcemaps.init())
            .pipe(uglify())
            .pipe(sourcemaps.write("."))
            .pipe(through2.obj(function(file, enc, next) {
                var self = this
                if (notJsfileCache.length !== 0) {
                    notJsfileCache.forEach(function(_file) {
                        streams.push(_file)
                    })
                    notJsfileCache.length = 0
                }
                self.push(file)
                next()
            }))
        return streams
    },
    /**
     * to create app.manifest and maps.js
     * @param {File} a gulp file
     */
    addToManifest: function(file, p) {
        if (!this._production) return
        var relativePath = path.relative(p._path, file.path)
        console.log('create file md5: ' + relativePath)
        var hash = this._createHash(file.contents.toString())
        var oldPath = path.join(p._family, p._name, relativePath)
        var newPath = path.join(path.dirname(oldPath), hash + path.extname(oldPath))
        this._manifestMap[oldPath] = newPath
        //rename file path
        file.path = path.join(path.dirname(file.path), hash + path.extname(oldPath))
    },
    _createManifestAndMap: function() {
        if (!this._production) return
        var self = this
        console.log('create manifest hash...')
        var allHash = this._calculateHash()
        var manifestBuf = []
        var mapBuf = []
        manifestBuf.push("CACHE MANIFEST")
        manifestBuf.push("#" + allHash)
        mapBuf.push('xpm.config({map: ' + JSON.stringify(this._manifestMap) + '})')
        _.each(this._manifestMap, function(source) {
            manifestBuf.push(self._config.static_url + "/" + source)
        })
        fs.writeFileSync(path.join(this._dest, "app.manifest"), manifestBuf.join('\n'))
        fs.writeFileSync(path.join(this._dest, "xpm_map.js"), mapBuf.join('\n'))
    },
    _createHash: function(str) {
        var hash = crypto.createHash('md5')
        hash.update(str)
        return hash.digest('hex')
    },
    _calculateHash:  function() {
        var hash = crypto.createHash('sha256')
        _.each(this._manifestMap, function(hashPath, path) {
            hash.update(path)
            hash.update(hashPath)
        })
        return hash.digest('hex')
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
                    console.error(e.message)
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
