var util = require('util')
var inspect = require('util').inspect
var fs = require('fs')
var path = require('path')
var vm = require('vm')
var coffee = require('coffee-script')

/**
 * @param {All}
 * @param {String}
 *        "Array", "Boolean", "Number", "String", "Object",
 *        "Function", "Symbol", "RegExp", "Date", "Error",
 *       "Buffer", "Primitive", "Null", "Undefined"
 *
 * @param {String | Ignore} error message
 *
 * @example
 *          assertType(a, "Array | Function", "this is a error msg.")
 *          assertType(a, "Function")
 */
function assertType(a, typename, errMsg) {
    var _keys = [
        "Array", "Boolean", "Number", "String", "Object",
        "Function", "Symbol", "RegExp", "Date", "Error",
        "Buffer", "Primitive", "Null", "Undefined"
    ]
    var _typename = typename.split(/\s*\|\s*/)
    for (var i = 0, len = _typename.length; i < len; i++) {
        if (!~_keys.indexOf(_typename[i]))
            throw new Error("assertType illegal param typename: " + typename)
        if (util["is" + _typename[i]](a)) return true
    }
    if (!errMsg) errMsg = inspect(a) + " need to be '" + typename + "'."
    throw new Error(errMsg)
}

/**
 * @example
 *      var a = {a:99}
 *      extend(a,{b:33,c:44},{a:22}).should.eql(a)
 *      a.should.eql({a:22,b:33,c:44})
 */
function extend() {
    var args, first, item
    args = [].slice.call(arguments, 0)
    first = args.shift()
    for (var i = 0, len = args.length; i < len; i++) {
        item = args[i]
        for (var key in item) {
            if (item.hasOwnProperty(key)) {
                first[key] = item[key]
            }
        }
    }
    return first
}

/**
 * exec file in the nodejs vm
 *
 * @param {Strig}  文件路径
 * @param {Object} 执行的全局空间
 * @param {Boolean} 是否有require
 * @param {Function | Ignore} [ {String} fileContent ] 对文件内容进行处理
 * @return {Object}
 *      {
 *          "isModule": {Boolean} //是否为通过module.exports扩展的
 *          "ret": {All}
 *      }
 */
//this is to register coffee compile to `require` extensition
coffee.register()
function execFileByContext(filepath, context, hasRequire, fileContentFilter) {
    var _module, sandbox, filecode, _oldExports
    sandbox = extend({}, context)
    //filepath = fs.realpathSync(filepath)
    filecode = fs.readFileSync(filepath).toString()
    if (fileContentFilter) {
        filecode = fileContentFilter(filecode)
    }
    //sandbox.console = console
    sandbox.global = global
    sandbox.console = console
    sandbox.__filename = filepath
    sandbox.__dirname = path.dirname(sandbox.__filename);
    sandbox.module = _module = new (require('module'))(filepath)
    sandbox.exports = _oldExports = _module.exports
    _module.filename = sandbox.__filename
    if (hasRequire) {
        sandbox.require = getRequireFn(filepath, _module)
    }
    //编译coffee
    if (path.extname(filepath) === ".coffee") {
        filecode = coffee.compile(filecode, {bare:true,filename:filepath});
    }
    vm.runInNewContext(filecode, sandbox, filepath)
    if (_module.exports !== _oldExports) { //module.exports被重新定义
        //返回module
        return {
            "isModule": true,
            ret: _module.exports
        }
    } else {
        return {
            "isModule": false,
            "ret": _module.exports || {}
        }
    }
}
/**
 * @param {String}
 * @param {Object | Ignore}
 */
function getRequireFn(filepath, _module) {
    var _module, Module, _require
    Module = require('module')
    if (!_module) {
        _module =  new Module(filepath)
    }
    _require = function(path) {
        return Module._load(path, _module, true)
    }
    Object.getOwnPropertyNames(require).forEach(function(item) {
        if (item !== 'paths') _require[item] = require[item]
    })
    _require.paths = _module.paths = Module._nodeModulePaths(filepath);
    _require.resolve = function(request) {
        return Module._resolveFilename(request, _module);
    };
    return _require
}

exports.assertType = assertType
exports.extend = extend
exports.execFileByContext = execFileByContext
exports.getRequireFn = getRequireFn
