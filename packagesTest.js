var xpm = require('./index')
var mymeteor = xpm.add({
    cwd: xpm.getMeteorPackageCwd(),
    default: true,
    imports: {app: {}}
})
setTimeout(function() {
    xpm.test(mymeteor, [
        "meteor",
        "deps",
        "ejson",
        "geojson-utils",
        "id-map",
        "ordered-dict",
        "random",
        "minimongo",
        "routepolicy",
        "logging"
    ])
}, 1000)

/*server.listen(3000, function() {
    console.log("Meteor server listen on 3000.")
})*/

