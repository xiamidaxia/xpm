#Xiami Package Manager

v0.0.6

a simple javascript package manager that can manage the client side and server side code together.

##tutorials

```javascript
var xpmServer = require('xpm').serverCreate({
    cwd: __dirname
})

var mypack = xpmServer.require('myfamily/mypack')

console.log(mypack.version)

```

```javascript
var xpmClient = require('xpm').clientCreate({
    cwd: __dirname,
    dest: __dirname + "/" + "dest"
})

xpmClient.add('myfamily/mypack')

```

In the 'mypack' package directory, you need to add the file `package.js` just like this:

```javascript
Package.describe({
    info: "this is a mypack package."
})

Package.server({
    require: ['underscore']             //your requires
    files: ['fil1', 'file2']
})

```

##command line


##API

