var gutil = require('gulp-util');
var through = require('through2')
var minify = require('html-minifier').minify;

var htmlmin = function(opts) {
    return through.obj(function(file, encoding, next) {
        try {
            file.contents = new Buffer(minify(String(file.contents), opts))
            this.push(file)
        } catch (err) {
            return next(new gutil.PluginError('gulp-htmlmin', err, opts))
        }
        next()
    })
}

module.exports = {
    "type": "template",
    "extnames": ['tpl', 'html', 'handlebars'],
    through: function(stream, package) {
        return stream.pipe(htmlmin({
            collapseBooleanAttributes: true,
            collapseWhitespace: true,
            removeAttributeQuotes: true,
            removeComments: true,
            removeEmptyAttributes: true,
            removeRedundantAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true
        }))
    }
}