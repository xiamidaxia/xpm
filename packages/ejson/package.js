Package.describe({
    summary: "Extended and Extensible JSON library",
    meteor: "0.8.1.3"
});

Package.all({
    "files": ['ejson', 'base64', 'stringify'],
    "exports": ["EJSON"]
})

Package.test({
    "files": ["test/custom_models_for_tests", "test/base64_test", "test/ejson_test"]
})