var gulp = require('gulp')
var path = require('path')
var karma = require('gulp-karma')

var cwd = path.join(__dirname, "..", "dest")
var paths = [
    path.join(cwd, 'xpm.js'),
    path.join(cwd, 'client_pack/**/*'),
    path.join(__dirname, 'test/**/*')
]
gulp.src(paths).pipe(karma({
    configFile: path.join(__dirname, "karma.default.conf.js"),
    action: "watch"
})).on('error', function(err) {
    throw err
})
