Package.server({
    files: ["**/**.js"],
    main: "no_extname",
    auto: true,
    exports: ['lib1','mainfile']
})