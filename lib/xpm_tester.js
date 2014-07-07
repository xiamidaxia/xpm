var Mocha = require('Mocha')
var _ = require('underscore')
var fs = require('fs')
// http://chaijs.com/api/assert/
var test = require('chai').assert
var path = require('path')

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
    var _allTestPackages = []
    mochaOpts = _.extend({
        reporter: "spec",
        timeout: 1200,
        bail: false
    }, mochaOpts)

    var mocha = new Mocha(mochaOpts)

    packageArr.forEach(function(item) {
        item = item.split("/")
        if (item.length !== 2)
            throw new Error("xpm test params uncorrect: " + packageArr)
        if (item[1] === "*") {
            fs.readdirSync(path.join(xpm._cwd, item[0])).forEach(function(packname) {
                if (packname.split("/") !== 0 ) return
                var realpath = path.join(self._cwd, item[0], packname)
                if (fs.statSync(realpath).isDirectory()) {
                    _allTestPackages.push(item[0], packname)
                }
            })
        } else {
            _allTestPackages.push(item)
        }
    })
    _allTestPackages.forEach(function(item) {
        var p = xpm.addPackage(item[0], item[1])
        var testfiles = p.getTestFiles()
        //add assert methods
        p._context.test = test
        //add the mocha context
        mocha.suite.emit('pre-require', p._context, null, mocha)
        //add test files
        p._allfiles = _.union(p._allfiles, testfiles)
        testfiles.forEach(function(filepath) {
            var extname = path.extname(filepath)
            var realpath = path.join(p._path, filepath)
            if (!fs.statSync(realpath).isDirectory() && (extname === ".js" || extname === ".coffee")) {
                var pathdetail = {
                    family: item[0],
                    packname: item[1],
                    path: realpath,
                    ismain: false
                }
                xpm._execFile(pathdetail)
            }
        })
    })

    mocha.run()
}


module.exports = xpmTest

