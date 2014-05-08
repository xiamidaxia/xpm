Package.describe({
    summary: "Dictionary data structure allowing non-string keys",
    meteor: true
});

Package.all({
    "require": ['ejson'],
    "files": ["id-map.js"],
    "exports": ["IdMap"]
})

