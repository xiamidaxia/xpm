/**
 *  xiami 包管理器
 *  @author liuwencheng
 *
 *    todo 1. add the gulp stream,
 */

var Xpm = require("./Xpm")
/**
 * @param {Object}
 *      {
 *          "cwd": {String} should be a real dir path, this will be changed in the future(todo).
 *          "isCheck": true 是否检测循环依赖，这是一个比较耗时的操作在生产环境可以动态设置为false, 默认true
 *      }
 */
exports.create = function(config) {
    return new Xpm(config)
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

exports.getMeteorPackageCwd = function() {
    return __dirname + "/packages"
}
/**
 *
 * @param {Xpm} xpm
 * @param {String} packageName
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
    require("./xpmTest")(xpm, packageName, mochaOpts)
}

