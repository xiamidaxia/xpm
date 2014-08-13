#Xiami Package Manager

v0.1.3

A powerful web server package manager that can manage the client side and server side code together, also bind many useful tools like coffeescript, less, stylus, jade, imagemin, mocha, chai and so on.

Using in the [xiami](https://github.com/xiamidaxia/xiami) web framework

##documents

[中文文档](https://github.com/xiamidaxia/xpm/blob/develop/docs/%E4%B8%AD%E6%96%87%E6%96%87%E6%A1%A3.md)

##install

npm install xpm2

##command line

```shell

    $ npm install xpm2 -g
    
    # need file `Xpmfile.js`  in your current directory, see `XpmfileExample.js`
    
    $ xpm run 

```

##为啥要做个，因为希望:

- 可以将 `npm install` 或 [bower](https://github.com/bower/bower) install 安装的代码无缝加载利用到前后端
    
```javascript
    //我只需要这样定义
    var xpmClient = xpm.createClient({
        family: {
            "npm": __dirname + "/node_modules",
            "bower": __dirname + "/bower_components"
        },
        dest: __dirname + "/dest"
    })
    //接着只要在包里加一个package.js说明文件我就能在浏览器上跑了,如下为浏览器端调用(异步):
    xpm.use("bower/jquery", "npm/underscore", function($, _){
        console.log($) 
        console.log(_)   
    }) 
```    
    
- 让前后端的代码完全通用

    真的不再需要像seajs一样还得加一个define来包装了, 真的毫无违和感哦，这样后端也能快速引用:

```javascript    
    var xpmServer = xpm.createServer({
        family: {
            "npm": __dirname + "/node_modules",
            "bower": __dirname + "/bower_components"
        }
    })
    //服务端调用
    var _ = xpmServer.require('npm/underscore')
    console.log(_)
```

- 可以处理多种格式并且可以插件扩展

    使用[gulpjs](https://github.com/gulpjs/gulp)，不管是less还是coffeescript文件都可以快速处理, 未来准备支持angular模板包

```javascript
    //这样我就能快速的自定义插件
    xpmClient.addPlugin({
        type: "coffee",
        extnames: [".coffee"],
        through: function(stream){
            return stream
                .pipe(require('gulp-coffee')({bare:true}))
                .pipe(through.obj(function(file, enc, next) {
                    file.path = gutil.replaceExtension(file.path, '.coffee');
                    this.push(file)
                    next()
                }))
        }
    })
    
```            
    
- 测试代码前后端通用并自动化运行
    
```javascript

    //这样就能让前端和后端代码的所有包指定的测试用例都跑起来
    xpmClient.test("[meteor/*, xiami/*]")
    xpmServer.test("[meteor/*, xiami/*]")
    
```

- 浏览器异步加载执行文件
    
    这个就不多解释了, 不异步都说不过去
        
- 完美无缝支持CommonJs  

    不再害怕 require("a" + "/b.js") 或者加if判断等怪异的加载方式
    
- 管理生产环境和开发环境不同的代码

    设置一下就能让代码完全不一样了

- 能跑[meteor](https://www.github.com/meteor/meteor)代码 

    或许，这才是我最初的目的 ＝。＝

##要做到这点我引进了一个package.js用来对包的描述

- 描述包的依赖关系
- 描述包需要加载的文件
- 描述包加载的文件用于前端还是后端
- 描述包的测试文件有哪些
- 描述包的文档和例子有哪些 (todo)

    这是我准备做的，因为我坚信 `代码即文档` ，文档和代码放在一起会更直观, 新人也能知道从何入手, 也知道如何去做技术沉淀

##未来

- manifest和sourceMap支持
- 针对单页面webapp应用开发功能, 比如我将css/html/js全部打包成一个文件用来加载，这个文件不就可以当成一个page来处理？


