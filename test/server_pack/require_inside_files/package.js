Package.server({
    files: ["core/core*.js", "addFile.js", "index.js"],
    auto:true,
    exports: ["add_core1_file","add_core2_file", "unaddFileCheck", "addFileCheck"]
})
