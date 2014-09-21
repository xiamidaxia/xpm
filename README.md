#Xiami Package Manager

v0.3.5

A powerful web server package manager that can manage the client side and server side code together, also bind many useful tools like coffeescript, less, stylus, jade, imagemin, mocha, chai and so on.

Using in the [xiami](https://github.com/xiamidaxia/xiami) web framework

##documents

[中文文档](https://github.com/xiamidaxia/xpm/blob/develop/docs/%E4%B8%AD%E6%96%87%E6%96%87%E6%A1%A3.md)

##install

npm install xpm2

##command line

```shell

    $ npm install xpm2 -g
    
    $ xpm run 

```

##examples

[xiami_examples](https://github.com/xiamidaxia/xiami_examples)

##特点:

- (前端调用) 可以将 `npm install` 或 [bower](https://github.com/bower/bower) install 安装的代码无缝加载利用到前端
    
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
    
- (后端调用) 让前后端的代码完全通用

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

    使用[gulpjs](https://github.com/gulpjs/gulp)，不管是less还是coffeescript文件都可以快速处理, 如已集成:.less, .stylus, .angular, .tpl, .html, .md, .coffee等及其对应插件（参见源码中的lib/plugins/）

```javascript
    //这样我就能快速的自定义插件,并扩展文件格式
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
        },
        tpl:
            '_module.addFile("{{{path}}}", function(require, exports, module) {\n' +
            '{{{contents}}}\n' +
            '})\n'
    })
    
```            
    
- 测试代码前后端通用并自动化运行, 亦可结合angular e2e测试工具实现端到端测试
    
```javascript

    //这样就能让前端和后端代码的所有包指定的测试用例都跑起来
    xpmClient.test("[meteor/*, xiami/*]")
    xpmServer.test("[meteor/*, xiami/*]")
    
```

- 浏览器异步加载执行文件
    
    这个就不多解释了, 不异步都说不过去
        
- 完美无缝支持CommonJs  

    不再害怕 require("a" + "/b.js") 或者加if判断等的加载方式
    
- 能跑[meteor](https://www.github.com/meteor/meteor)代码 

    或许，这才是我最初的目的 ＝。＝

- 自动生成sourceMap及manifest文件，自动版本控制，自动压缩合并代码并发布生产环境, 例子可见 [xiami-examples](https://github.com/xiamidaxia/xiami_examples)


