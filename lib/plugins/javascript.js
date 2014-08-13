var through = require('through2')
var path = require('path')
//json
var jsonThrough = function() {
    return through.obj(function(file, encoding, next) {
        var self = this
        if (path.extname(file.path) === ".json") {
            file.contents = new Buffer("module.exports = " + file.contents.toString())
        }
        self.push(file)
        next()
    })
}
module.exports = {
    type: "javascript",
    extnames: [".js", ".json"],
    through: function(stream) {
        return stream
            .pipe(jsonThrough())
            .pipe(require('gulp-jshint')())
    },
    pretty: true,
    tpl: '_module.addFile("{{{path}}}", function(require, exports, module) {\n' +
            '{{{contents}}}\n' +
        '})\n'
}

