module.exports = {
    "type": "stylesheet",
    "extnames": ["css"],
    "through": function(stream) {
        return stream.pipe(require('gulp-cssmin')())
    }
}