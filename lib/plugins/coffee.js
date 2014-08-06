
var through = require('through2')
var path = require('path')
var gutil = require('gulp-util');
module.exports = {
    type: "coffee",
    extnames: [".coffee"],
    through: function(stream) {
        return stream
            .pipe(require('gulp-coffee')({bare:true}))
            .pipe(through.obj(function(file, enc, next) {
                file.path = gutil.replaceExtension(file.path, '.coffee');
                this.push(file)
                next()
            }))
    }
}