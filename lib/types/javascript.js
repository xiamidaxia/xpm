var through = require('through2')
var path = require('path')
var gulpUtil = require('gulp-util')

module.exports = {
    type: "javascript",
    extnames: ["js"],
    through: function(stream, package, xpm) {
        return stream.pipe(through.obj(function(file, encoding, next) {
            var relpath = path.relative(file.cwd, file.path)
/*            if (relpath === "checks/file1.js") {
                var _file = new gutil.File({
                    path: "checks/bbb/newpath.js",
                    contents: new Buffer("damn")
                })
                this.push(_file)
            } else if (relpath === "checks/test.css"){
                console.log(file.contents.toString())
            } else if (relpath === "checks/test.html"){
                console.log(file.contents.toString())
            }*/
            next()

        }))
    }
}