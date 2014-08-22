var through = require('through2')
var less = require('less')
var gutil = require('gulp-util')
var stylus = require('stylus')
var path = require('path')
var nib = require('nib')


var typesThrough = function() {
    return through.obj(function(file, encoding, next) {
        var self = this
        var cb = function(e, css) {
            if (e) {
                console.error(e)
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
                less.render(file.contents.toString(), cb);
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
var fixUrl = function(config, pack) {
    return through.obj(function(file, encoding, next) {
        var reg = /url\(([^)]*)\)/g
        var contents = file.contents.toString()
        var contentArr = []
        var cursor = 0
        while(result = reg.exec(contents)) {
            var len = result[0].length
            var dirname = path.dirname(path.relative(file.base, file.path))
            var newPath
            var static_prefix
            contentArr.push(contents.substring(cursor, reg.lastIndex - len))
            //is relative
            if (result[1].charAt(0) === ".") {
                static_prefix = "/" + pack._family + "/" + pack._name + "/"
                static_prefix = (config.static_url || "/static") + static_prefix
                newPath = static_prefix + path.join(dirname, result[1])
            } else {
                newPath = result[1]
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
    "through": function(stream, config, pack) {
        return stream
            .pipe(typesThrough())
            .pipe(require('gulp-cssmin')({
                keepSpecialComments: 0
            }))
            .pipe(escapeThrough())
            .pipe(fixUrl(config, pack))
    },
    tpl: '_module.addStyle("{{{path}}}", "{{{contents}}}")\n'
}
