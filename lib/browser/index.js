/*
 *  xpm包管理器(浏览器端)
 *
 *  @author liuwencheng [xiamidaxia@gmail.com]
 */
;(function(_global) {
    global = _global
    _global.isClient = true
    _global.xpm = {}
    extend(_global.xpm, {
        _cache: {},
        _cwd: "/static",
        /**
         * @param {String} path
         * @param {Array} requireArr
         * @param {Function} fn
         */
        define: function(path, requireArr, fn) {
            var _deps = [], cache = this._cache
            if (cache[path]) return
            _deps = requireArr.slice()
            if (_done()) return
            //load require
            requireArr.forEach(function(_req) {
                if (cache[_req]) {
                    _done(_req)
                } else {
                    loadSrc(_req, function() {
                        _done(_req)
                    })
                }
            })
            /**
             * @param {String | Ignore} 需要移除的依赖项
             * @private
             */
            function _done(_req) {
                var _require, _module
                if (_req) _deps.splice(_deps.indexOf(_req), 1)
                if (_deps.length === 0) {
                    _require = {}
                    _module = new Module()
                    requireArr.forEach(function(item) {
                        _require[item] = cache[item]._exports
                    })
                    //exec define callback
                    fn(_require, _module._exports, _module)
                    cache[path] = _module
                    return true
                }
                return false
            }
        },
        use: function(pathArr, cb) {
            pathArr.forEach(function(path) {

            })
        },
        /**
         * @param opts
         *      {
         *          cwd: "/static"
         *      }
         */
        config: function(opts) {

        },
        /**
         * 添加样式
         * @param {String}
         */
        addStyle: function(styleContent) {
            var head = document.head ||
                document.getElementsByTagName('head')[0] ||
                document.documentElement
            var el = document.createElement("style")
            el.innerHTML = styleContent
            head.appendChild(el)
        }

    })
    /**
     * @constructor
     */
    function Module() {
        //require, exports, files
        //module tpls
        this._exports = {}
        this.assets = []
    }

    extend(Module.prototype, {
        addStyle: function(styleContent) {
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
                throw new Error('未知类型的文件：' + src)
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
})(window)
