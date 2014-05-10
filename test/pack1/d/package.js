Package.server({
    files: ["file1.js"],
    alias: {
        "_": "underscore"
    },
    exports: ["name", "_"]
})