#Xiami Package Manager

v0.0.8

A powerful web server package manager that can manage the client side and server side code together, also bind many useful tools like coffeescript, less, stylus, jade, imagemin, mocha, chai and so on.

Using in the [xiami](https://github.com/xiamidaxia/xiami) web framework

##documents

[中文文档](https://github.com/xiamidaxia/xpm/blob/develop/docs/%E4%B8%AD%E6%96%87%E6%96%87%E6%A1%A3.md)

##tutorials

```javascript
//init server side code manager
var xpmServer = require('xpm2').serverCreate({
    family: {
        meteor: __dirname + "/meteor",
        //declare your family code path
        myfamily: "/any/real/path"
    }
})

var mypack = xpmServer.require('myfamily/mypack')
console.log(mypack.version)
//this will auto run unit test in server
xpmServer.test(["myfamily/mypack"])

```

```javascript
//init client side code manager
var xpmClient = require('xpm2').clientCreate({
    family: {
        meteor: __dirname + "/meteor",
        myfamily: "/any/real/path"
    },
    dest: __dirname + "/" + "dest"
})

xpmClient.add('myfamily/mypack')
//this will auto run unit test in browser
xpmClient.test(['myfamily/mypack'])
//render to a static file
xpmClient.run()
```

In the 'mypack' package directory, you need to add the file `package.js` just like this:

```javascript
//just describe
Package.describe({
    info: "this is a mypack package."
    version: "0.0.1"
})
//files you want to use both client side and server side
Package.all({
    files: ["common.js"]
    test_files: ["test/**/*.js"]
})
//files only in server
Package.server({
    imports: ['underscore']             
    files: ['file1.js', 'file2.js']
})
//files in client, you can use many file types like '.less' '.styl' '.tpl' and so on
Package.client({
    imports: ['underscore']             
    files: ['client*.js', "**/*.styl", "**/*.jpg"]
})

```

