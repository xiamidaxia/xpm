Package.describe({
    "summary": "a simple connect webserver",
    "version": "0.0.1"
})

Package.server({
    require: [
        "logging",
        "routepolicy"
    ],
    files: ["default_config", "util", "Xiami"],
    exports: ["Xiami"],
    tests: ["xiami_test.coffee"]
})

