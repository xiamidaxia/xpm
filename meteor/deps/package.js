Package.describe({
    summary: "Dependency mananger to allow reactive callbacks",
    meteor: "0.8.1.3"
});

Package.all({
    "require": ["meteor"],
    "files": ['deps'],
    "tests": ["deps_tests.js"],
    "exports": ["Deps"]
})
