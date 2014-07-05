Package.describe({
    summary: "meteor common",
    meteor: "0.8.1.3"
});
Package.server({
    require: ["underscore"],
    alias: {
        "underscore": "_"
    },
    files: [
        "server",
        "debug",
        "dynamics_nodejs",
        "fiber_helpers",
        "helpers",
        "setimmediate",
        "timers",
        "url_common",
        "url_server"
    ],
    exports: ["Meteor"],
/*    tests: [
        'test/debug_test.coffee',
        'test/dynamics_test',
        "test/fiber_helpers_test",
        "test/helpers_test",
        "test/timers_tests",
        "test/url_tests"
    ]*/
})

Package.client({
    require: ["underscore"],
    files: ["client.js","debug.js"],
    exports: ["Meteor"]
})

