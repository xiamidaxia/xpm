Package.server({
    require: ["has_default_main", "module_exports"],
    auto: true,
    alias: {
        default_main: "alia1",
        module_exports: "alia2"
    },
    exports: "alias"
})