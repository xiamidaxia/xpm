Package.describe({
    summary: "meteor common",
    meteor: "0.8.1.3"
});
Package.server({
    require: ["underscore"],
    nrequire: ["fibers", "fibers/future", "path"],
    alias: {
        "fibers": "Fiber",
        "fibers/future": "Future",
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
    exports: ["Meteor"]
})

Package.client({
    require: ["underscore"],
    files: ["client.js","debug.js"],
    exports: ["Meteor"]
})

Package.test({
    files: [
        'test/debug_test.coffee',
        'test/dynamics_test',
        "test/fiber_helpers_test",
        "test/helpers_test",
        "test/timers_tests",
        "test/url_tests"
    ]
})
