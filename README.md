#Xiami Package Manager

v0.0.6

a simple javascript package manager that can manage the client code and server code together.

##tutorials

```javascript
var xpm = require('xpm').serverCreate({
    cwd: __dirname
})

var mypack = xpm.require('myfamily/mypack')

console.log(mypack.version)

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


##API

