module.exports = {
    type: "javascript",
    extnames: [".js"],
    through: function(stream) {
        return stream
            .pipe(require('gulp-jshint')())
    }
}

