require('./mocha')
if (!document.getElementById('mocha')) {
    var $mocha = document.createElement("div")
    $mocha.setAttribute("id", "mocha")
    document.body.appendChild($mocha)
}
module.exports = global.mocha