#Xiami Package Manager

v0.0.3

a simple [Meteor](https://github.com/meteor/meteor) package manager, also can be used as a javascript 
code package manager, and manage the server side and client side code togother.

##what is different from `meteor` packages?
    - work well with the node modules, can use `npm` immediately.
    - bind popular 3rd-part tools `mocha` `chai` `coffeescript`, and can easily append others.
    - bind meteor famous packages like `ejson` `deps` `minimongo` `livedata`, these packages are very very useful I think.
    - remove meteor ui and meteor template engine `spacebars`, so you can use others like `angularjs`.
    - a new webapp package can be as a Middleware.
    - a new client package manager keeping to `commonjs`.
    
##tutorials

```javascript
var xpm = require('xpm')
var pack1 = xpm.create({
                cwd: __dirname + "/you_pack_dirname"
            })
var mypack1 = pack1.require("mypack1")

console.log(mypack1.version)

```

In the 'mypack1' package directory, you need to add the file `package.js` just like this:

```javascript
Package.describe({
    info: "this is a mypack1 package."
})

Package.server({
    require: ['underscore']             //your requires
    files: ['fil1', 'file2']
    exports: ['mymethod', 'version']
})

```

Ok, you can add the standard packages from [Meteor](https://github.com/meteor/meteor) in the xpm `packages` directory.

```javascript
var server = require('connect').createServer()
var xpm = require('xpm')

var mymeteor = xpm.create({
    cwd: xpm.getMeteorPackageCwd(),
    default: true,
    imports: {app: server}
})

mymeteor.use('random')
mymeteor.use('deps')
mymeteor.use('minimongo')

server.listen(3000, function() {
    console.log("Meteor server listen on 3000.")
})

```

##API
###xpm

this can be used to create a Xpm instance.

* xpm.create({Object} config) : {Xpm}
    - cwd {String}
    - check {Boolean | Ignore} check if it is recurse require, you can set to false if it is in production. default true.
    - default {Boolean | Ignore} check if can add the default package, default false.
    - imports {Object | Ignore} this can be imported to the default package opts "imports".

* xpm.getMiddleware({Array} xpmArr, {Object | Ignore} opts) : {Function}

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

- require({Array})

- files({Array})

- exports({Array})

- nrequire({Array})  only in the Package.server()

- alias({Object})

- defaults({Array}) only use in the default Package.js

- imports({Array | Object}) only use in the default Packge.js

