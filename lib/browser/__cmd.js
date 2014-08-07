global = window
global.isClient = true
var _requires = {}
function _wrapModule(name, fn) {
    var _module = {exports:{}}
    var _exports = _module.exports
    var _require = function(name) {
        if(_requires[name]) {
            return _requires[name]
        } else {
            throw new Error('xpm can not get native module: ' + name)
        }
    }
    fn.call(null, _require, _exports, _module)
    _requires[name] = _module.exports
}
