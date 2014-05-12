Package.describe({
  summary: "Meteor's client-side datastore: a port of MongoDB to Javascript",
  meteor: 'minimongo'
});

Package.server({
    require: ["ejson", "id-map", "ordered-dict",'random','deps','geojson-utils'],
    files: [
        "minimongo"
    ]
})

