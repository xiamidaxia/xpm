Package.describe({
    summary: "Meteor's client-side datastore: a port of MongoDB to Javascript",
    meteor: true
});

Package.all({
    "require": ["ejson","id-map","ordered-dict","deps","random"],
    "files": [],
    //"exports": ["LocalCollection", "Minimongo"]
})
