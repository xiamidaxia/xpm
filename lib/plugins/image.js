module.exports = {
    "type": "image",
    "extnames": [".jpg", ".jpeg", ".png", ".gif"],
    "through": function(stream, config) {
        if (config.production) {
            return stream.pipe(
                require('gulp-imagemin')({
                    optimizationLevel: 7,
                    progressive: true
                })
            )
        } else {
            return stream
        }
    },
    static: true,
    tpl: '_module.addFile("{{{path}}}", function(require, exports, module){\n' +
        '   var image = new Image \n' +
        '   image.src = _module.getFullPath("{{{path}}}") \n' +
        '   module.exports = image\n' +
        '})\n'
}
