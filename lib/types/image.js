module.exports = {
    "type": "image",
    "extnames": [".jpg", ".jpeg", ".png", ".svg", ".gif"],
    "through": function(stream) {
        return stream.pipe(require('gulp-imagemin')({
            optimizationLevel: 7,
            progressive: true
        }))
    }
}