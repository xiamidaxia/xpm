var util = require('util')
var inspect = require('util').inspect
var fs = require('fs')
var path = require('path')
var vm = require('vm')
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
 * @param {Function | Ignore} [ {String} fileContent ] 对文件内容进行处理
 * @return {Object}
 *      {
 *          "isModule": {Boolean} //是否为通过module.exports扩展的
 *          "ret": {All}
 *      }
 */
function execFileByContext(filepath, context, fileContentFilter) {
    var fileContent
    var _exports = {}
/*    var _require = function(name) {
        var ret
        try {
            ret = require(path.join(path.dirname(filepath),"node_modules", name))
        } catch (e) {
            ret = require(name)
            return ret
        }
        return ret
    }*/
    var newContext = extend({
        console: console,
        //require: _require,
        module: {exports: _exports}, //模拟exports
        exports: {}
    }, context)
    var NODE_KEY = ["console", "require", "module", "exports"]
    //_context = vm.createContext(context)
    fileContent = fs.readFileSync(filepath).toString()
    if (fileContentFilter) {
        fileContent = fileContentFilter(fileContent)
    }
    vm.runInNewContext(fileContent, newContext, filepath)
    if (newContext.module.exports !== _exports) { //module.exports被重新定义
        //返回module
        return {
            "isModule": true,
            ret: newContext.module.exports
        }
    } else {
        if (!isObjectEmpty(newContext.exports)) {
            //exports添加了内容
            return {
                "isModule": false,
                "ret": newContext.exports
            }
        } else {
            //返回添加到全局里的
            NODE_KEY.forEach(function(item) {
                delete newContext[item]
            })
            return {
                "isModule": false,
                "ret": newContext
            }
        }
    }
}

function isObjectEmpty(obj) {
    for (var i in obj) {
        return false
    }
    return true
}

exports.assertType = assertType
exports.extend = extend
exports.execFileByContext = execFileByContext
