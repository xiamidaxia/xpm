var execFileByContext = require('./util').execFileByContext
var Mocha = require('Mocha')
var _ = require('underscore')
// http://chaijs.com/api/assert/
var test = require('chai').assert

/**
 * @param xpm
 * @param {Array} packageArr
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
function xpmTest(xpm, packageArr, mochaOpts) {
    mochaOpts = _.extend({
        reporter: "spec",
        timeout: 1200,
        bail: false
    }, mochaOpts)

    var mocha = new Mocha(mochaOpts)

    packageArr.forEach(function(packname) {
        var pack = xpm.use(packname)
        var context = {}
        //add assert methods
        context.test = test
        //add the mocha context
        mocha.suite.emit('pre-require', context, null, mocha)
        pack._test.files.forEach(function(filename) {
            var testRet
            //extend package all context on the test files
            _.extend(context, pack._context)
            testRet = execFileByContext(pack.getFilePath(filename), context)
            if (testRet.isModule) throw new Error('test file can not use `module.exports`')
            _.extend(context, testRet.ret)
        })
    })
    mocha.run()
}


module.exports = xpmTest

