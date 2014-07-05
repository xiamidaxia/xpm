require('./core/core1.js')
exports.add_core1_file = require('./core/core1.js')
exports.add_core2_file = require('./core/core2.js')
exports.unaddFileCheck = function() {
    require('./unaddFile.js')
}
exports.addFileCheck = function() {
    return require('./core/core3.js')()
}
