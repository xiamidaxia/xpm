/**
 * todo: add angular template
 *
 */
var gutil = require('gulp-util');
var jade = require('jade')
var through = require('through2')
var minify = require('html-minifier').minify;
var path = require('path')

var htmlmin = function(opts) {
    var escapeContent = function(content, quoteChar, indentString) {
        var bsRegexp = new RegExp('\\\\', 'g');
        var quoteRegexp = new RegExp('\\' + quoteChar, 'g')
        var nlReplace = '\\n' + quoteChar + ' +\n' + indentString + indentString + quoteChar
        return content.replace(bsRegexp, '\\\\').replace(quoteRegexp, '\\' + quoteChar).replace(/\r?\n/g, nlReplace)
    }
    function isJadeTemplate(filepath) {
        var jadeExtension = /\.jade$/;
        return jadeExtension.test(filepath);
    }

    // return template content
    var minifyContent = function(file, opts) {
        var content = file.contents.toString()
        //renderJade
        if (isJadeTemplate(file.path)) {
            content = jade.render(content, {
                pretty: true
            });
        }
        if (Object.keys(opts.htmlmin).length) {
            content = minify(content, htmlmin);
        }
        // trim leading whitespace
        content = content.replace(/(^\s*)/g, '');

        return escapeContent(content, opts.quoteChar, opts.indentString);
    };

    return through.obj(function(file, encoding, next) {
        try {
            file.contents = new Buffer(minifyContent(file, opts))
            this.push(file)
        } catch (err) {
            return next(new gutil.PluginError('gulp-htmlmin', err, opts))
        }
        next()
    })
}

module.exports = {
    "type": "template",
    "extnames": ['.tpl', '.jade', '.html', '.htm', '.handlebars', '.mustache', '.angular'],
    through: function(stream) {
        return stream.pipe(htmlmin({
            quoteChar: '"',
            indentString: '  ',
            htmlmin: {
                collapseBooleanAttributes: true,
                collapseWhitespace: true,
                removeAttributeQuotes: true,
                removeComments: true,
                removeEmptyAttributes: true,
                removeRedundantAttributes: true,
                removeScriptTypeAttributes: true,
                removeStyleLinkTypeAttributes: true
            }
        }))
    }
}