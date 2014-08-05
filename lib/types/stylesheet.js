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

module.exports = {
    "type": "stylesheet",
    "extnames": [".css",".less",".stylus",'.styl'],
    "through": function(stream) {
        return stream
            .pipe(typesThrough())
            .pipe(require('gulp-cssmin')())
            .pipe(escapeThrough())
    }
}