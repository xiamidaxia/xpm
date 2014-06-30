/**
 *  xiami 包管理器
 *  @author liuwencheng
 *
 *    todo 1. add the gulp stream,
 */

var Xpm = require("./lib/XpmServer")
var _addedXpms = {} //cache the xpm
var path = require('path')
/**
 * @param {Object}
 *      {
 *          "cwd": {String} should be a real dir path, this will be changed in the future(todo).
 *          "isCheck": true 是否检测循环依赖，生产环境可以设置为false, 默认true
 *      }
 */
exports.add = function(config) {
    var name
    name = path.basename(config.cwd)
    if (_addedXpms[name]) {
        throw new Error("xpm: " + name + " is added.")
    } else {
        return _addedXpms[name] = new Xpm(config)
    }
}
/**
 * xpm can be used by middlewares
 *
 * @param {Array} xpmArr
 * @param {Object | Ignore}
 *
 * @return {Function}
 */
exports.getMiddleware = function(xpmArr, opts) {

}
/**
 *
 * @returns {string}
 */
exports.getMeteorPackageCwd = function() {
    return __dirname + "/packages"
}
/**
 * build all packages to the dist directory
 */
exports.build = function() {

}
/**
 *
 * @param {Xpm} xpm
 * @param {Array} packageArr
 * @param {Optional String} mochaOpts
 *   - `ui` name "bdd", "tdd", "exports" etc
 *   - `reporter` reporter instance, defaults to `mocha.reporters.Dot`
 *   - `globals` array of accepted globals
 *   - `timeout` timeout in milliseconds
 *   - `bail` bail on the first test failure
 *   - `slow` milliseconds to wait before considering a test slow
 *   - `ignoreLeaks` ignore global leaks
 *   - `grep` string or regexp to filter tests with
 */
exports.test = function(xpm, packageName, mochaOpts) {
    require("./lib/xpm_tester")(xpm, packageName, mochaOpts)
}

