/*
 *  xpm包管理器(浏览器端)
 *
 *  @author liuwencheng [xiamidaxia@gmail.com]
 */
var path = require('path')

var xpm = global.xpm = {}

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
            fn: fn
        })
        var _deps = depArr.slice()
        var checkLoaded = function(loadedDep) {
            if (loadedDep)
                _deps = _deps.splice(_deps.indexOf(loadedDep), 1)
            if (_deps.length === 0) {
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
                loadSrc(self._srcpath + "/" + dep + "/index.js")
            }
            if (cache[dep] && cache[dep].loaded) {
                checkLoaded(dep)
            } else {
                self._onLoading(dep, checkLoaded)
            }
        })
    },
    use: function(names, cb) {
        var self = this
        var cbArgs = []
        if (typeof names === "string") names = [names]
        var items = names.slice()
        var _checkLoaded = function(loadedPath, detail, index) {
            items.splice(items.indexOf(loadedPath), 1)
            cbArgs[index] = self._execFile(detail)
            if (items.length === 0) {
                cb.apply(null, cbArgs)
            }
        }
        names.forEach(function(pathStr, index) {
            var detail = self._getRequirePathDetail(pathStr)
            var packname = detail.packname
            if (!self._cache[packname] ) {
                loadSrc(self._srcpath + "/" + packname + "/package.js")
            }
            if (self._cache[packname] && self._cache[packname].loaded) {
                _checkLoaded(pathStr, detail, index)
            } else {
                self._onLoading(packname, function() {
                    _checkLoaded(pathStr, detail, index)
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
            for (var i= 0, len=fns; i<len; i++) {
                fns[i]()
            }
            delete self._loadingCache[name]
        }
    },
    /*
     * 执行指定的路径
     * @param {Object} 路径详情
     */
    _execFile: function(pathDetail) {
        var self = this
        var packname = pathDetail.packname
        var p = self._cache[packname]
        var curpath = pathDetail.path
        var relativepath
        //is main file
        if (pathDetail.ismain)
            curpath = p._mainpath
        if (path.extname(curpath) === "") curpath = curpath + ".js"
        relativepath = path.relative(p._path, curpath)
        //读取缓存
        if (p._fileCache[relativepath]) return p._fileCache[relativepath]
        //设定require
        var _require = function(pathStr) {
            var _detail
            _detail = self._getRequirePathDetail(pathStr, curpath)
            return self._execFile(_detail)
        }
        var _module = {exports:{}}
        var _exports = _module.exports
        p._allfiles[relativepath].call(null, _require, _module, _exports)
        return p._fileCache[relativepath] = _module.exports
    },
    /**
     * @param {String} 路径字符串
     * @param {String | Ignore} 当前的文件路径
     */
    _getRequirePathDetail: function(pathStr, curfilepath) {
        var realpath, dirpath, details, ismain
        var standard_reg = /^([^\/\.]+)\/([^\/\.]+)\/*(.*)$/
        if (!curfilepath && pathStr.charAt(0) === ".") {
            throw new Error("require('" + pathStr + "'): can not use '.' or '..' out of package" )
        } else if (pathStr.charAt(0) === ".") {
            dirpath = path.dirname(curfilepath)
            realpath = path.join(dirpath, pathStr)
        } else if (pathStr.charAt(0) === "/") {
            throw new Error("[" + curfilepath + "] require('" + pathStr + "'): can not use root path.")
        } else if (standard_reg.exec(pathStr)) {
            realpath = pathStr
        } else {
            throw new Error("[" + curfilepath + "] require('" + pathStr + "'): uncorrect.")
        }
        if (/^\.\.\/.*/.test(realpath))
            throw new Error("[" + curfilepath + "] require('" + pathStr + "'): outer workspace.")
        details = realpath.split('/')
        if (!details[1])
            throw new Error("[" + curfilepath + "] require('" + pathStr + "'): uncorrect.")
        if (realpath.split("/").length === 2) {
            ismain = true
        }
        return {
            packname: details[0] + "/" + details[1],
            path: realpath,
            ismain: ismain || false
        }
    }
})
/**
 * @constructor
 */
function Package(opts) {
    this._name = opts.name
    this._allfiles = {}
    this._fileCache = {}
    this.loaded = false
    this._setMainPath("index.js")
    opts.fn.call(null, this)
}

extend(Package.prototype, {
    _addStyle: function(styleContent) {
        var head = document.head ||
            document.getElementsByTagName('head')[0] ||
            document.documentElement
        var el = document.createElement('style')
        el.innerHTML = styleContent
        head.appendChild(el)
    },
    _addFile: function(filepath, fn) {
        this._allfiles[filepath] = fn
    },
    _setMainPath: function(mainname) {
        this._mainpath = this._name + "/" + mainname
    },
    getFullPath: function() {
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

