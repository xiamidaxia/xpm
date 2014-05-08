Package.describe({
    summary: "Dependency mananger to allow reactive callbacks",
    meteor: true
});

Package.all({
    "files": ['deps', 'deprecated'],
    "exports": ["Deps"]
})

