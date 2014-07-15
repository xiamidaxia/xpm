var gulp = require('gulp')
var path = require('path')
var karma = require('gulp-karma')

var cwd = path.join(__dirname, "..", "dest")
var paths = [
    path.join(__dirname, "../../bower_components/should/should.js"),
    path.join(cwd, 'xpm.js'),
    path.join(cwd, 'client_pack/**/*.js'),
    path.join(__dirname, 'file.js')
]
gulp.src(paths).pipe(karma({
    configFile: path.join(__dirname, "../../lib/karma.default.conf.js"),
    action: "watch"
})).on('error', function(err) {
    throw err
})
