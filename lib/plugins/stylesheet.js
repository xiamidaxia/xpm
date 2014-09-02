var through = require('through2')
var less = require('less')
var gutil = require('gulp-util')
var stylus = require('stylus')
var path = require('path')
var nib = require('nib')
var url = require('url')


var typesThrough = function() {
    return through.obj(function(file, encoding, next) {
        var self = this
        var cb = function(e, css) {
            if (e) {
                console.error(e)
                next()
                return
            }
            file.path = gutil.replaceExtension(file.path, '.css');
            file.contents = new Buffer(css)
            self.push(file)
            next()
        }
        switch(path.extname(file.path)) {
            case ".stylus":
            case ".styl":
                stylus(file.contents.toString())
                    .set('filename', file.path)
                    //.set('paths', gConfig.paths)
                    .use(nib())
                    .render(cb)
                break
            case ".less":
                less.render(file.contents.toString(), {
                    filename: file.path
                }, cb);
                break
            default:
                this.push(file)
                next()
        }
    })
}

var escapeThrough = function() {
    return through.obj(function(file, encoding, next) {
        var escapeContent = function(content) {
            var bsRegexp = new RegExp('\\\\', 'g');
            var doubleQuoteRegexp = new RegExp('\\"', 'g')
            var singleQuoteRegexp = new RegExp("\\'", 'g')
            return content
                .replace(bsRegexp, '\\\\')
                .replace(doubleQuoteRegexp, '\\"')
                .replace(singleQuoteRegexp, "\\'")
        }
        file.contents = new Buffer(escapeContent(file.contents.toString()))
        this.push(file)
        next()
    })
}

/**
 * fix css relative url
 * @returns {*}
 */
var fixUrl = function(opts) {
    return through.obj(function(file, encoding, next) {
        var reg = /url\(([^)]*)\)/g
        var contents = file.contents.toString()
        var contentArr = []
        var cursor = 0
        var manifestMap = opts.xpm._manifestMap
        while(result = reg.exec(contents)) {
            var len = result[0].length
            var newPath
            var static_prefix
            var dirname = path.dirname(path.relative(file.base, file.path))
            var srcUrl = result[1]
            contentArr.push(contents.substring(cursor, reg.lastIndex - len))
            //is relative
            if (srcUrl.charAt(0) === ".") {
                static_prefix = opts.package._family + "/" + opts.package._name + "/"
                newPath = static_prefix + path.join(dirname, srcUrl)
                if (opts.config.production) {
                    if (manifestMap[url.parse(newPath).pathname]) {
                        newPath = manifestMap[url.parse(newPath).pathname]
                    } else {
                        console.warn('['+ static_prefix + path.relative(file.base, file.path) +'] can not find css url: ' + srcUrl)
                    }
                }
                newPath = opts.config.static_url + "/" + newPath
            } else {
                newPath = srcUrl
            }
            contentArr.push("url("+newPath+")")
            cursor = reg.lastIndex
        }
        contentArr.push(contents.substring(cursor))
        file.contents = new Buffer(contentArr.join(''))
        this.push(file)
        next()
    })
}

module.exports = {
    "type": "stylesheet",
    "extnames": [".css",".less",".stylus",'.styl'],
    "through": function(stream, opts) {
        return stream
            .pipe(typesThrough())
            .pipe(require('gulp-cssmin')({
                keepSpecialComments: 0
            }))
            .pipe(escapeThrough())
            .pipe(fixUrl(opts))
    },
    tpl: '_module.addStyle("{{{path}}}", "{{{contents}}}")\n'
}
