Package.all({
    files: ["**/*"],
    test_files: "*test*"
})

Package.all({
    files: "^unneed*",
    test_files: ["^unneed*"]
})