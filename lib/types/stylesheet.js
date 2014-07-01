var through = require('through2')

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
    "extnames": [".css"],
    "through": function(stream) {
        return stream.pipe(require('gulp-cssmin')()).pipe(escapeThrough())
    }
}