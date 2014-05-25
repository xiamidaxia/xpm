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
        "helpers"
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
        'test/dynamics_test.coffee',
        "test/fiber_helpers_test.js",
        //"test/helpers_test.js"
    ]
})
