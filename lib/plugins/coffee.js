
var through = require('through2')
var path = require('path')
var gutil = require('gulp-util');
module.exports = {
    type: "coffee",
    extnames: [".coffee"],
    through: function(stream) {
        return stream
            .pipe(require('gulp-coffee')({bare:true})
                .on('error', function(error) {
                    console.log(error.stack)
                })
            )
            .pipe(through.obj(function(file, enc, next) {
                file.path = gutil.replaceExtension(file.path, '.coffee');
                this.push(file)
                next()
            }))
    },
    pretty: true,
    tpl:
    '_module.addFile("{{{path}}}", function(require, exports, module) {\n' +
    '{{{contents}}}\n' +
    '})\n'
}
