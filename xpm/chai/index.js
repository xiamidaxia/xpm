var chai = require('./chai')
module.exports = function(name) {
    if (name === "assert") {
        global.assert = chai.assert
        global.test = chai.assert
    } else if (name === "should") {
        chai.should()
        chai.use(require('xpm/sinon-chai'))
    } else {
        global.expect = chai.expect
    }
}