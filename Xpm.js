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
 * //todo 目前采用同步加载，可以改成异步加载来提高性能
 *      {
 *          "cwd": {String} should be a real dir path, this will be changed in the future(todo).
 *          "check": {Boolean} true 是否检测循环依赖，这是一个比较耗时的操作在生产环境可以动态设置为false, 默认true
 *          "default": {Boolean} false 是否需要调用默认包，默认该值为false
 *          "outs": {Object} this will add to the default outs.
 *      }
 */
function Xpm(config) {
    if (!config.cwd) throw new Error("create Xpm need parameteor 'cwd'. ")
    if (config.cwd[0] !== "/") throw new Error("create Xpm cwd '" + config.cwd + "' need a real path.")
    this._cwd = path.join(config.cwd)
    this._checkRecurse = config.check === undefined ? true : config.check
    this.outs = config.outs
    this._clientMap = {}
    this._serverMap = {}
    this._defaultLoaded = false
    if (config.default) this._addDefaultPackage()
}
proto = Xpm.prototype
proto.use = function(packageName) {
    this._serverUse(packageName)
    this._clientUse(packageName)
}
/**
 * [Server]
 * this only use in the server side
 */
proto._serverUse = function(packageName) {
    return this._addPackage(packageName, "server").getExports()
}
proto.require = proto._serverUse
/**
 * [client]
 */
proto._clientUse = function(packageName) {
    var p = this._addPackage(packageName, "client")
    //todo
    //p.exec()
}
proto._addPackage = function(packageName, type, isDefault) {
    var p, requireArr, self, _map, context, _defaultPack, _outs
    self = this
    _map = this.getMap(type)
    context = {}
    _outs = {}
    if (p = _map[packageName]) return p
    p = _map[packageName] = new Package({cwd: this._cwd, name: packageName, type: type, default: isDefault})
    //p.readPackagejs() //读取package.js文件
    requireArr = p.getRequireArr()
    requireArr.forEach(function(item) {
        self._addPackage(item, type) //add the require package
    })
    //此处用于检测是否有循环依赖, 在某种情况下这一步可以去掉
    if (this._checkRecurse) this._setPackageSequencyRequire(p, requireArr, type)
    //执行
    if (type === "server") {
        if (self._defaultLoaded) { //扩展默认的
            defaultPack = self._getDefaultPackage(type)
            _.each(defaultPack.getOuts() || {}, function(key) {
                if (!self.outs || !self.outs[key]) throw new Error("default package needs "+key+" value from this xpm 'out' param.")
                _outs[key] = self.outs[key]
            })
            _.extend(context, _outs, defaultPack.getExports())
        }
        //this.outs = config.outs
        _.each(p.getRequire(), function(item) {
            context[item] = self._serverMap[item].getExports()
        })
        p.exec(context)
    } else {
        p.exec()
    }
    return p
}
proto._setPackageSequencyRequire = function(packageObj, requireArr, type) {
    var result = [], items = {}, self = this
    if (!packageObj.getSequencyRequire()) {
        _.each(self.getMap(type), function(item, key) {
            items[key] = {
                name: key,
                dep: item.getRequireArr()
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
    this._addPackage("__default__", "client", true)
    this._defaultLoaded = true
}
//proto.get
module.exports = Xpm