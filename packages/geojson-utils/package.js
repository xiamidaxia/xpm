Package.describe({
  summary: 'GeoJSON utility functions (from https://github.com/maxogden/geojson-js-utils)',
  meteor: "0.8.1.3"
});

Package.all({
    "files": ['geojson-utils.js'],
    "exports": ["GeoJSON"]
})

Package.test({
    "files": ["geojson-utils.tests.js"]
})
