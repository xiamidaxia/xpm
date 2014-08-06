#Xiami Package Manager

v0.0.7

A powerful webside package manager that can manage the client side and server side code together, also bind many useful tools like coffeescript, less, stylus, jade, imagemin, mocha, chai and so on.

Using in the [xiami](https://github.com/xiamidaxia/xiami) web server

##tutorials

```javascript
var xpmServer = require('xpm2').serverCreate({
    family: {
        meteor: __dirname + "/meteor",
        myfamily: "/any/real/path"
    }
})

var mypack = xpmServer.require('myfamily/mypack')

console.log(mypack.version)

```

```javascript
var xpmClient = require('xpm2').clientCreate({
    family: {
        meteor: __dirname + "/meteor",
        myfamily: "/any/real/path"
    },
    dest: __dirname + "/" + "dest"
})

xpmClient.add('myfamily/mypack')

```

In the 'mypack' package directory, you need to add the file `package.js` just like this:

```javascript
Package.describe({
    info: "this is a mypack package."
})
Package.all({
    files: ["common.js"]
    test_files: ["test/**/*.js"]
})
Package.server({
    imports: ['underscore']             
    files: ['file1.js', 'file2.js']
})

Package.client({
    imports: ['underscore']             
    files: ['client*.js', "**/*.styl", "**/*.jpg"]
})

```

##command line


##API

