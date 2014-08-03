module.exports = {
    type: "javascript",
    extnames: [".coffee"],
    through: function(stream) {
        return stream
            .pipe(require('gulp-coffee')({bare:true}))
    }
}
