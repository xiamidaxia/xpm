Package.server({
    require: ["b", "a"],
    files: ["file1"],
    exports: ["c", "name", "a", "b1", "b2", "d"]
})