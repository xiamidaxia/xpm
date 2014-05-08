Package.describe({
    summary: "Extended and Extensible JSON library",
    meteor: true
});

Package.all({
    "files": ['ejson', 'base64', 'stringify'],
    "exports": ["EJSON"]
})

