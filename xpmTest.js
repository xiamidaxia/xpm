var execFileByContext = require('./util').execFileByContext
var Mocha = require('Mocha')
var _ = require('underscore')
/**
 * @param xpm
 * @param {String} packageName || "all"
 * @param mochaOpts
 *   - `ui` name "bdd", "tdd", "exports" etc
 *   - `reporter` reporter instance, defaults to `mocha.reporters.Dot`
 *   - `globals` array of accepted globals
 *   - `timeout` timeout in milliseconds
 *   - `bail` bail on the first test failure
 *   - `slow` milliseconds to wait before considering a test slow
 *   - `ignoreLeaks` ignore global leaks
 *   - `grep` string or regexp to filter tests with
 */
function xpmTest(xpm, packageName, mochaOpts) {
    var packs = []
    packs.push(xpm.use(packageName))
    mochaOpts = _.extend({
        reporter: "spec",
        timeout: 1200,
        bail: true
    }, mochaOpts)
    var mocha = new Mocha(mochaOpts)
    packs.forEach(function(pack) {
        var context = {}
        mocha.suite.emit('pre-require', context) //add the mocha context
        pack._test.files.forEach(function(filename) {
            pack.exportsToContext(context)
            execFileByContext(pack.getFilePath(filename), context, true)
        })
    })
    mocha.run()
}

module.exports = xpmTest

