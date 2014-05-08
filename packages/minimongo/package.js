Package.describe({
  summary: "Meteor's client-side datastore: a port of MongoDB to Javascript",
  meteor: 'minimongo'
});

Package.all({
    require: ["ejson", "id-map", "ordered-dict",'random','deps','geojson-utils'],
    files: [
        'minimongo.js',
        'wrap_transform.js',
        'helpers.js',
        'selector.js',
        'sort.js',
        'projection.js',
        'modify.js',
        'diff.js',
        'id_map.js',
        'observe.js',
        'objectid.js'
    ],
    exports: ["Minimongo", 'LocalCollection']
})

Package.server({
    files: [
        'selector_projection.js',
        'selector_modifier.js',
        'sorter_projection.js'
    ]
})
