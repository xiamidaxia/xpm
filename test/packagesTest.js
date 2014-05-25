var server = require('connect').createServer()
var xpm = require('../')
var mymeteor = xpm.add({
    cwd: xpm.getMeteorPackageCwd(),
    default: true,
    imports: {app: server}
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
        "minimongo"
    ])
}, 1000)

/*server.listen(3000, function() {
    console.log("Meteor server listen on 3000.")
})*/

