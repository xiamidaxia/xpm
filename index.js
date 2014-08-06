/**
 *  xiami 包管理器
 *  @author liuwencheng
 *
 */

var XpmServer = require("./lib/xpm_server")
var XpmClient = require('./lib/xpm_client')
var path = require('path')
global.isServer = true
global.isClient = false
/**
* @param {Object} config
 *      {
 *          "production": {Boolean} 是否为生产环境
 *          "family": {Object} family path map
 *              eg: {
 *                      "meteor": __dirname + "/meteor",
 *                      "xiami": __dirname + "/xiami"
 *                  }
 *      }
*/
exports.serverCreate = function(config) {
    return new XpmServer(config)
}

/**
 * @param {Object} config
 *      {
 *          "dest": {String} 编译后的目标目录
 *          "production": {Boolean} 是否为生产环境
 *          "family": {Object} family path map
 *              eg: {
 *                      "meteor": __dirname + "/meteor",
 *                      "xiami": __dirname + "/xiami"
 *                  }
 *      }
 */
exports.clientCreate = function(config) {
    return new XpmClient(config)
}
/**
 *
 * @param {XpmClient | XpmServer} xpm
 * @param {Array} testArr
 *      eg:
 *          ["family/pack1", "meteor/pack2","meteor/pack1"]
 *          ['family/*', "meteor/*"]
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
exports.test = function(xpm, testArr, mochaOpts) {
    return xpm.test(testArr,mochaOpts)
}

exports.util = require('./lib/util')
