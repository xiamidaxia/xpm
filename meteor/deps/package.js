Package.describe({
    summary: "Dependency mananger to allow reactive callbacks",
    meteor: "0.8.1.3"
})

Package.all({
    "main": "deps.js",
    "tests": ["deps_tests.js"]
})
