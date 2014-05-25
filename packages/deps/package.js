Package.describe({
    summary: "Dependency mananger to allow reactive callbacks",
    meteor: "deps"
});

Package.all({
    "files": ['deps'],
    "exports": ["Deps"]
})

Package.test({
    "files": ["test.coffee"]
})