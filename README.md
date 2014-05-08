#Xiami Package Manager

v0.0.1

a simple javascript code package manager, can be manage well
with the client side and server side code, like [Meteor](https://github.com/meteor/meteor) package.

##tutorials

```javascript
var xpm = require('xpm')
var pack1 = xpm.create({
                cwd: __dirname + "/you_pack_dirname"
            })
var meteor = pack1.require("meteor")

console.log(meteor.version)

```

In the package like 'meteor', you need to add the file 'package.js' just like this:

```javascript
Package.describe({
    info: "this is a meteor package."
})

Package.server({
    require: ['underscore']             //your requires
    files: ['fil1.js', 'file2.js']
    exports: ['meteor']
})

```
##API
###xpm

this can be used to create a Xpm instance.

* xpm.create({Object} config)
    - cwd {String}
    - check {Boolean | Ignore} check if it is recurse require, you can set to false if it is in production. default true.
    - default {Boolean | Ignore} check if can add the default package, default false.
    - imports {Object | Ignore} this can be imported to the default package opts "imports".

* xpm.getMiddleware({Array} xpmArr, {Object | Ignore} opts)

###Xpm Module

- Xpm.use({String} packagename)

- Xpm.require({String} packagename)

###Package Module
- Package.describe(info)
 describe your package.

- Package.server(opts)
 use in the server side. see `opts`

- Package.client(opts)
 use in the client side. see `opts`

- Package.all(opts)
 this opts can be used to both the server and client sides, see `opts`

###opts

- require({Array | Object})

- files({Array})

- exports({Array | Object})

- nrequire({Array | Object})  only in the Package.server()

- defaults({Array | Object}) only use in the default Package.js

- imports({Array | Object}) only use in the default Packge.js

