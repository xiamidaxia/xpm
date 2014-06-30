/** {{family}}/{{name}} **/
xpm.define("family/pack", ["fm/pack1", "fm/pack2"], function(require, exports, module){

//require and alias

var alias1 = require["fm/pack1"]['cccc']
var alias1 = require["fm/pack1"]['cc2']

module.addStyle('stylecontent')
module.assets['tplName'] = 'tplContent'

//define exports names
var a, b, c, d
//check exports
function __check__() {
    a = exports["a"] = module.exports
    b = exports["b"]
    c = exports["b"]
    d = exports["b"]
}

//file3
;(function(a, b, c, d){

exports.a = 3333

})();__check__()

//file1
;(function(){
})()

//file2
;(function(){
    console.log(a) //44
    console.log(b) //55
})()

//if (!isTest)  return

module.tests['file1'] = function(){
    //testcontent
}

module.tests['file2'] = function(){
    //testcontent
}

})