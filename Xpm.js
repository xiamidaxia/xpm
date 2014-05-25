/**
 *  Xiami Package Manager (XPM) Model.
 *
 *  @author liuwencheng [xiamidaxia@gmail.com]
 *
 */
var Package = require('./Package')
var util = require('./util')
var sequency = require('sequencify')
var _ = require('underscore')
var path = require('path')
var proto
/**
 * @public
 * @param {Object} config
 * //todo 目前采用同步加载，可以改成Fiber加载来提高性能
 * //todo imports要在创建的时候就检测是否为default
 * //todo 加入客户端包管理seajs
 * //todo 加入客户端代码测试工具 mocha
 *      {
 *          "cwd": {String} should be a real dir path, this will be changed in the future(todo).
 *          "check": {Boolean} true 是否检测循环依赖，这是一个比较耗时的操作在生产环境可以动态设置为false, 默认true
 *          "default": {Boolean} false 是否需要调用默认包，默认该值为false
 *          "imports": {Object} this will add to the default imports.
 *          "dist": {String} dist目录名字
 *      }
 */
function Xpm(config) {
    if (!config.cwd) throw new Error("create Xpm need parameteor 'cwd'. ")
    if (config.cwd[0] !== "/") throw new Error("create Xpm cwd '" + config.cwd + "' need a real path.")
    this._cwd = config.cwd
    this._checkRecurse = config.check === undefined ? true : config.check
    this._dist = config.dist
    this.imports = config.imports
    this._clientMap = {}
    this._serverMap = {}
    this._defaultLoaded = false
    if (config.default) this._addDefaultPackage()
}
proto = Xpm.prototype
proto.use = function(packageName) {
    this._clientUse(packageName)
    return this.serverUse(packageName)
}
/**
 * [Server]
 * this only use in the server side
 */
proto.serverUse = function(packageName) {
    return this._addPackage(packageName, "server")
}
proto.require = function(packageName) {
    return this._addPackage(packageName, "server").getExports()
}
/**
 * [client]
 */
proto._clientUse = function(packageName) {
    //var p = this._addPackage(packageName, "client")
    //todo
}
proto.load = function(packageName) {
}
proto._addPackage = function(packageName, type, isDefault) {
    var p, requireArr, self, _map, context
    self = this
    _map = this.getMap(type)
    context = {}
    if (p = _map[packageName]) return p
    p = _map[packageName] = new Package({cwd: this._cwd, name: packageName, type: type, default: isDefault})
    //p.readPackagejs() //读取package.js文件
    requireArr = p.getRequire()
    requireArr.forEach(function(item) {
        self._addPackage(item, type) //add the require package
    })
    //此处用于检测是否有循环依赖, 在某种情况下这一步可以去掉
    if (this._checkRecurse) this._setPackageSequencyRequire(p, requireArr, type)
    //执行
    if (type === "server") {
        self._extendDefaults(context, type)
        p.getRequire().forEach(function(_packname) {
            self._serverMap[_packname].exportsToContext(context)
        })
        p.exec(context)
    } else {
        p.exec()
    }
    return p
}
proto._extendDefaults = function(context, type) {
    var _imports = {}
    var self = this
    var defaultPack = self._getDefaultPackage(type)
    if (defaultPack) {
        defaultPack.getImports().forEach(function(name) {
            if (!self.imports || !self.imports[name]) throw new Error("you must import a value `"+name+"` .")
            _imports[name] = self.imports[name]
        })
        util.extend(context, _imports)
    }
    if (self._defaultLoaded) { //默认包已经加载完成则扩展到所有其他包
        defaultPack.exportsToContext(context)
    }

}

proto._setPackageSequencyRequire = function(packageObj, requireArr, type) {
    var result = [], items = {}, self = this
    if (!packageObj.getSequencyRequire()) {
        _.each(self.getMap(type), function(_packObj, _packname) {
            items[_packname] = {
                name: _packname,
                dep: _packObj.getRequire()
            }
        })
        sequency(items, requireArr, result)
        packageObj.setSequencyRequire(result)
    }
}
proto.getMap = function(type) {
    return this["_" + type + "Map"]
}
proto._getDefaultPackage = function(type) {
    return this["_" + type + "Map"]['__default__']
}
proto._addDefaultPackage = function() {
    this._addPackage("__default__", "server", true)
    //this._addPackage("__default__", "client", true)
    this._defaultLoaded = true
}
//proto.get
module.exports = Xpm
