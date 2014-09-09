
Package.all({
    files: ["**/*", "^**/*","lib/lib.js","**/*"],
    test_files: "*test*"
})

Package.all({
    files: "^unneed*",
    test_files: ["^unneed*"]
})

