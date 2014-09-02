var Mocha = require('Mocha')
var _ = require('underscore')
var fs = require('fs')
// http://chaijs.com/api/assert/
var chai = require('chai')
var assert = chai.assert
var expect = chai.expect
var path = require('path')
var sinon = require("sinon");
var sinonChai = require("sinon-chai");

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
    var _allTestPackages = xpm.getFullPackages(packageArr)
    mochaOpts = _.extend({
        reporter: "spec",
        timeout: 1200,
        bail: false,
        test: "assert"
    }, mochaOpts)

    var mocha = new Mocha(mochaOpts)

    _allTestPackages.forEach(function(item) {
        item = item.split("/")
        var p = xpm.addPackage(item[0], item[1])
        var testfiles = p.getTestFiles()
        //add sinonJS
        p._context.sinon = sinon
        //add assert methods
        if (mochaOpts.test === "assert") {
            p._context.assert = assert
            p._context.test = assert
        } else if (mochaOpts.test === "should"){
            chai.should()
            chai.use(sinonChai)
        } else {
            p._context.expect = expect
        }
        //add the mocha context
        mocha.suite.emit('pre-require', p._context, null, mocha)
        //add test files
        p._allfiles = _.union(p._allfiles, testfiles)
        if (testfiles.length === 0) {
            console.log("[server] warn: no test files in '" + p._family + "/" + p._name + "'")
        }
        testfiles.forEach(function(filepath) {
            var extname = path.extname(filepath)
            var realpath = path.join(p._path, filepath)
            if (!fs.statSync(realpath).isDirectory() && (extname === ".js" || extname === ".coffee")) {
                var pathdetail = {
                    family: item[0],
                    packname: item[1],
                    path: filepath,
                    ismain: false
                }
                xpm._execFile(pathdetail)
            }
        })
    })

    mocha.run()
}


module.exports = xpmTest

