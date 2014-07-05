Package.server({
    require: ["b", "a"],
    files: ["file1.js"],
    exports: ["c", "name", "A", "b1", "b2", "d"]
})