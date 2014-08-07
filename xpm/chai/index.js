var chai = require('./chai')
module.exports = function(name) {
    if (name === "assert") {
        global.assert = chai.assert
        global.test = chai.test
    } else if (name === "should") {
        chai.should()
    } else {
        global.expect = chai.expect
    }
}