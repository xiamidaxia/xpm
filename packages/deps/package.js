Package.describe({
    summary: "Dependency mananger to allow reactive callbacks",
    meteor: "0.8.1.3"
});

Package.all({
    "files": ['deps'],
    "exports": ["Deps"]
})

Package.test({
    "files": ["deps_tests.js"]
})