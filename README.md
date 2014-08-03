#Xiami Package Manager

v0.0.6

a simple javascript package manager that can manage the client side and server side code together.

use in the [xiami](https://github.com/xiamidaxia/xiami) web server

##tutorials

```javascript
var xpmServer = require('xpm').serverCreate({
    family: {
        meteor: __dirname + "/meteor"
    }
})

var mypack = xpmServer.require('myfamily/mypack')

console.log(mypack.version)

```

```javascript
var xpmClient = require('xpm').clientCreate({
    family: {
        meteor: __dirname + "/meteor"
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

Package.server({
    require: ['underscore']             //your requires
    files: ['fil1', 'file2']
})

```

##command line


##API

