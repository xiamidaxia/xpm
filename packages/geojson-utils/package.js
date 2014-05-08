Package.describe({
    summary: 'GeoJSON utility functions (from https://github.com/maxogden/geojson-js-utils)',
    meteor: true
});

Package.all({
    files: ["pre", "geojson-utils", "post"],
    exports: ["GeoJSON"]
})

