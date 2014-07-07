var util = require('util')
var inspect = require('util').inspect
var fs = require('fs')
var path = require('path')
var vm = require('vm')
var coffee = require('coffee-script')
var _ = require('underscore')

/**
 * @param {All}
 * @param {String}
 *        "Array", "Boolean", "Number", "String", "Object",
 *        "Function", "RegExp", "Date", "Error",
 *       "Null", "Undefined"
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
        "Function", "RegExp", "Date", "Error",
        "Null", "Undefined"
    ]
    var _typename = typename.split(/\s*\|\s*/)
    for (var i = 0, len = _typename.length; i < len; i++) {
        if (!~_keys.indexOf(_typename[i]))
            throw new Error("assertType illegal param typename: " + typename)
        if (_["is" + _typename[i]](a)) return true
    }
    if (!errMsg) errMsg = inspect(a) + " need to be '" + typename + "'."
    throw new TypeError(errMsg)
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
 * @param {Boolean}
 * @return {Object} exports
 */
function execFileByContext(filepath, context, noRequire) {
    var _module, sandbox, filecode, _oldExports, keys, wrapFn
    var Module = require('module')
    filepath = fs.realpathSync(filepath)

    sandbox = {} //_.clone(context)
    _module = new Module(filepath)
    filecode = fs.readFileSync(filepath, 'utf8')
    filecode = stripBOM(filecode)
    // remove shebang
    filecode = filecode.replace(/^\#\!.*/, '');

    sandbox.__filename = filepath
    sandbox.__dirname = path.dirname(sandbox.__filename);
    sandbox.module = _module
    sandbox.exports = _oldExports = _module.exports
    _module.filename = sandbox.__filename
    if (!noRequire) sandbox.require = getRequireFn(filepath, _module)
    extend(sandbox, context)
    keys = _.keys(sandbox)
    //编译coffee
    if (path.extname(filepath) === ".coffee") {
        filecode = coffee.compile(filecode, {filename:filepath}); //bare:true
    }
    filecode = "(function("+keys.join(",")+"){\n" + filecode + "\n})"
    //注：这里若使用runInNewContext将导致在vm中intanceof无法正常使用
    wrapFn = vm.runInThisContext(filecode, filepath)
    wrapFn.apply(global, keys.map(function(item) {
        return sandbox[item]
    }))
    if (_module.exports !== _oldExports) {
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
    var Module, _require
    Module = require('module')
    if (!_module) {
        _module =  new Module(filepath)
        _module.filename = filepath
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
    //_require.extensions = Module._extensions
    //_require.cache = Module._cache
    return _require
}

function stripBOM(content) {
    // Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
    // because the buffer-to-string conversion in `fs.readFileSync()`
    // translates it to FEFF, the UTF-16 BOM.
    if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
    }
    return content;
}

//this is to register coffee extension `.coffee` to node `require`
coffee.register()

exports.assertType = assertType
exports.extend = extend
exports.execFileByContext = execFileByContext
exports.getRequireFn = getRequireFn
