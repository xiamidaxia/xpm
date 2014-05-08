Package.describe({
    summary: "Random number generator and utilities",
    meteor: "random"
});

Package.all({
    "files": ["random", "uuid"],
    "exports": ["Random"]
})

Package.server({
    "nrequire": {
        nodeCrypto: 'crypto'
    }
})
/*Package.on_test(function(api) {
 api.use('random');
 api.use('tinytest');
 api.add_files('random_tests.js', ['client', 'server']);
 });*/
