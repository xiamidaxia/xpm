Package.describe({
    summary: "route policy declarations",
    meteor: "0.8.1.3"
});

Package.server({
    files: ["routepolicy"],
    exports: ["RoutePolicy"]
})

Package.test({
    files: ["routepolicy_tests"]
})

