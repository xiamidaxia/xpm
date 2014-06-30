Package.describe({
    summary: "Random number generator and utilities",
    meteor: "0.8.1.3"
});

Package.all({
    "files": ["random", "deprecated"],
    "exports": ["Random"],
    "tests": ["random_tests"]
})

