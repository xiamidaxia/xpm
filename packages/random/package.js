Package.describe({
    summary: "Random number generator and utilities",
    meteor: "0.8.1.3"
});

Package.all({
    "files": ["random", "deprecated"],
    "exports": ["Random"]
})

Package.server({
    "nrequire": ['crypto'],
    alias: {
        'crypto': "nodeCrypto"
    }
})

Package.test({
    "files": ["random_tests"]
})
