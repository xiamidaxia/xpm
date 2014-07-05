module.exports = {
    type: "javascript",
    extnames: [".js", ".coffee"],
    through: function(stream) {
        return stream
            .pipe(require('gulp-coffee')({bare:true}))
            .pipe(require('gulp-jshint')())
    }
}

