/*
 *  xiami package manager (browser)
 *
 *  @author liuwencheng [xiamidaxia@gmail.com]
 */
var path = require('path')

if (!Function.prototype.bind) {
    require('es5-shim') //support ecma5
}
if (!global.JSON) {
   require('json2') //support JSON
}
var xpm = global.xpm = module.exports = {}

extend(xpm, {
    _cache: {},
    _loadingCache: {},
    _srcpath: "/static",
    config: function(opts) {
        this._srcpath = opts.src
    },
    define: function(packageName, depArr, fn) {
        var self = this
        var cache = self._cache
        var _p = cache[packageName] = new Package({
            name: packageName,
            deps: depArr,
            fn: fn
        })
        var _depLoadingCount = depArr.length
        var checkLoaded = function(loadedDep) {
            if (loadedDep)
                _depLoadingCount --
            if (_depLoadingCount === 0) {
                if (_p._main_preload) {
                    xpm._execFile({packname: packageName, ismain: true})
                }
                _p.loaded = true
                self._emitLoaded(packageName)
                return true
            } else {
                return false
            }
        }
        if (checkLoaded()) return
        depArr.forEach(function(dep) {
            if (!cache[dep] ) {
                loadSrc(self._srcpath + "/" + dep + "/package.js")
            }
            if (cache[dep] && cache[dep].loaded) {
                checkLoaded(dep)
            } else {
                self._onLoading(dep, function() {
                    checkLoaded(dep)
                })
            }
        })
    },
    use: function(names, cb) {
        var self = this
        var cbArgs = []
        if (typeof names === "string") names = [names]
        var loadingCount = names.length
        var _checkLoaded = function(loadedName, detail, index) {
            loadingCount--
            cbArgs[index] = self._execFile(detail)
            if (loadingCount === 0) {
                cb.apply(null, cbArgs)
            }
        }
        names.forEach(function(name, index) {
            var detail = self._getRequirePathDetail(name)
            var packname = detail.packname
            if (!self._cache[packname] ) {
                loadSrc(self._srcpath + "/" + packname + "/package.js")
            }
            if (self._cache[packname] && self._cache[packname].loaded) {
                _checkLoaded(name, detail, index)
            } else {
                self._onLoading(packname, function() {
                    _checkLoaded(name, detail, index)
                })
            }
        })
    },
    _onLoading: function(name, fn) {
        var self = this
        if (!self._loadingCache[name]) self._loadingCache[name] = []
        self._loadingCache[name].push(fn)

    },
    _emitLoaded: function(name) {
        var self = this
        var fns
        if ( fns = self._loadingCache[name]) {
            for (var i= 0, len=fns.length; i<len; i++) {
                fns[i]()
            }
            delete self._loadingCache[name]
        }
    },
    /**
     * @param pathDetail
     *      {
     *          packname: {String}
     *          path: {path}
     *          ismain: {boolean}
     *      }
     * @private
     */
    _execFile: function(pathDetail) {
        var self = this
        var packname = pathDetail.packname
        var p = self._cache[packname]
        var curpath = pathDetail.path
        //is main file
        if (pathDetail.ismain)
            curpath = p._mainpath
        if (path.extname(curpath) === "") curpath = curpath + ".js"
        //read file cache
        if (p._fileCache[curpath]) return p._fileCache[curpath]
        //set require
        var _require = function(pathStr, isNative) {
            var _detail
            if (isNative || /^[^\/]+$/.test(pathStr)) {
                return require(pathStr)
            }
            _detail = self._getRequirePathDetail(pathStr, curpath, p)
            return self._execFile(_detail)
        }
        var _module = {exports:{}}
        var _exports = _module.exports
        if (p._allfiles[curpath]) {
            p._allfiles[curpath].call(null, _require, _exports, _module)
        } else {
            throw new Error(p._msg("not add file: " + curpath))
        }
        return p._fileCache[curpath] = _module.exports || {}
    },
    /**
     * @param pathStr
     * @param curpath
     * @param p
     * @private
     */
    _getRequirePathDetail: function(pathStr, curpath, p) {
        var self = this
        var relativepath, details, ismain, packname,dirpath
        //var standard_reg = /^[^\/\.]+\/[^\/\.]+.*$/
        var _throw = function(str) {
            if (p) {
                throw new Error(p._msg("[" + curpath + "] require('" + pathStr + "'): " + str))
            } else {
                throw new Error("require('" + pathStr + "'): " + str)
            }
        }
        if (!p && pathStr.charAt(0) === ".") {
            _throw("can not use '.' or '..' out of package" )
        } else if (pathStr.charAt(0) === "/") {
            _throw("can not use root path.")
        } else if (pathStr.charAt(0) === ".") {
            dirpath = path.dirname(curpath)
            relativepath = path.join(dirpath, pathStr)
            if (relativepath.charAt(0) === ".")
                _throw ("outer current package workspace.")
            ismain = relativepath === ""
            packname = p._name
        } else {
            details = pathStr.split('/')
            if (details.length < 2 ) _throw ("uncorrect.")
            packname = details[0] + "/" + details[1]
            details.shift()
            details.shift()
            relativepath = details.join("/")
            if (details.length === 0 || (details.length === 1 && details[0] === "")) {
                ismain = true
                relativepath = ""
            }
        }
        if (p) {
            p._checkDeps(packname)
        }
        return {
            packname: packname,
            path: relativepath,
            ismain: ismain || false
        }
    }
})
/**
 * @constructor
 */
function Package(opts) {
    this._name = opts.name
    this._deps = opts.deps
    this._allfiles = {}
    this._fileCache = {}
    this.loaded = false
    this._main_preload = false
    opts.fn.call(null, this)
}

extend(Package.prototype, {
    addStyle: function(styleContent) {
        var head = document.head ||
            document.getElementsByTagName('head')[0] ||
            document.documentElement
        var el = document.createElement('style')
        el.innerHTML = styleContent
        head.appendChild(el)
    },
    addFile: function(filepath, fn) {
        this._allfiles[filepath] = fn
    },
    setMainPath: function(mainname) {
        this._mainpath = mainname
    },
    preload: function() {
        this._main_preload = true
    },
    _msg: function(msg) {
        return "[" + this._name + "] " + msg
    },
    _checkDeps: function(dep) {
        if (dep !== this._name && !~this._deps.indexOf(dep))
            throw new Error(this._msg("need to imports package: " + dep))
    },
    getFullPath: function(path) {
        return xpm._srcpath + "/" + this._name + "/" + path
    }
})
/*
 * 异步加载脚本文件
 * @param {String} 只能是.js 和 .css
 * @param {Function} onload后回调
 */
function loadSrc(src, callback) {
    var head = document.head ||
        document.getElementsByTagName('head')[0] ||
        document.documentElement
    var type = src.split('.')[1]
    var el
    switch (type) {
        case "js":
            el = document.createElement('script')
            el.onload = el.onerror = el.onreadystatechange = function() {
                if (!el.readyState || /loaded|complete/.test(el.readyState)) {
                    el.onload = el.onerror = el.onreadystatechange = null
                    if (el.parentNode) head.removeChild(el)
                    callback && callback()
                }
            }
            el.setAttribute('type', 'text/javascript')
            el.async = 'async'
            el.src = src
            break;
        case "css":
            el = document.createElement('link')
            el.setAttribute('type', 'text/css')
            el.rel = 'stylesheet'
            el.href = src
            el.onload = callback
            break;
        default:
            throw new Error('src unknow type：' + src)
    }
    //var script = head.getElementsByTagName('script')[0];
    //head.insertBefore(sc, script);
    head.appendChild(el)
}

function extend() {
    var args, first, item
    args = [].slice.call(arguments, 0)
    first = args.shift()
    for (var i = 0, len = args.length; i < len; i++) {
        item = args[i]
        for (var key in item) {
            if (item.hasOwnProperty(key)) {
                first[key] = item[key]
            }
        }
    }
    return first
}

