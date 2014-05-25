Package.server({
    files: ["file1.js"],
    alias: {
        "underscore": "_"
    },
    exports: ["name", "_"]
})