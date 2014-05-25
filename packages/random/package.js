Package.describe({
    summary: "Random number generator and utilities",
    meteor: "random"
});

Package.all({
    "files": ["random", "uuid"],
    "exports": ["Random"]
})

Package.server({
    "nrequire": ['crypto'],
    alias: {
        'crypto': "nodeCrypto"
    }
})
