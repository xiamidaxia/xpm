global = window
global.isClient = true
var _requires = {}
function _wrapModule(name, fn) {
    var _module = {exports:{}}
    var _exports = _module.exports
    var _require = function(name) {
        return _requires[name]
    }
    fn.call(null, _require, _exports, _module)
    _requires[name] = _module.exports
}
