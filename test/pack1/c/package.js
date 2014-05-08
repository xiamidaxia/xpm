Package.server({
    require: {
        "b": "b",
        "a": "a"
    },
    exports: {"B": "a", "A": "b"}
})
Package.all({
    files: ["file1"],
    exports: {"B": "b", "A":"a", "NAME": "name"}
})
