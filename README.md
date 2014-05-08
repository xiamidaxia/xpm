#Xiami Package Manager

a simple javascript code package manager, can be manage well
with the client side and server side code, like [Meteor](https://github.com/meteor/meteor) package.

##tutorials

```javascript
var xpm = require('xpm')
var pack1 = xpm.createPackage({
                cwd: __dirname + "/you_pack_dirname"
            })
var meteor = pack1.require("meteor")

console.log(meteor.version)

```

in the package like 'meteor', you need to add the file 'package.js' like this:

```javascript
Package.describe({
    info: "this is a meteor package"
})

Package.server({
    require: ['underscore']             //your requires
    files: ['fil1.js', 'file2.js']
    exports: ['meteor']
})

```
