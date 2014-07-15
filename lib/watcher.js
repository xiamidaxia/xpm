var fs = require('fs')
var path = require('path')

/**
 * @param {String} dir
 * @param {Function} ({String} realPath) 回调函数为文件全名
 * @param {Array || Ignore} 要忽略的文件名
 */
function ls(dir, cb, ignoreRegs) {
    try {
        fs.readdirSync(dir).forEach(function(item) {
            var realpath = path.join(dir, item)
            if (ignoreRegs) {
                for (var i = 0, len = ignoreRegs.length; i < len; i++) {
                    if (ignoreRegs[i].test(item)) {
                        return
                    }
                }
            }
            cb(realpath)
            if (fs.statSync(realpath).isDirectory()) {
                ls(realpath, cb, ignoreRegs)
            }
        })
    } catch (err) {
        console.warn("watcher-ls err: " + err)
    }
}

function watchDir(dirPath, cb, cache, ignoreRegs) {
    cache.push(dirPath)
    fs.watch(dirPath, function(event, filename){
        if(!filename) return
        var filePath = path.join(dirPath, filename)
        if (ignoreRegs) {
            for (var i = 0, len = ignoreRegs.length; i < len; i++) {
                if (ignoreRegs[i].test(filePath)) {
                    return
                }
            }
        }
        fs.stat(filePath, function(err,states) {
            if(err) {
                //console.warn(err.message)
                return
            }
            if(!states.isDirectory()) {
                //console.log(event, filePath)
                cb(filePath, event)
            }else{
                if(!~cache.indexOf(filePath)) {
                    watchDir(filePath, cb, cache)
                }
            }
        })
    })

}

/**
 * @param {String} filepath
 * @param {Function} (filepath, event) changeCb
 * @param {Array} [{RegExp}..] ignoreRegs
 */
module.exports = function(filepath, changeCb, ignoreRegs) {
    var _cache = []
    if(!fs.statSync(filepath).isDirectory()) throw new Error(filepath + ' need to be a directory.')
    watchDir(filepath, changeCb, _cache)
    ls(filepath, function(realPath) {
        if(fs.statSync(realPath).isDirectory()) {
            watchDir(realPath, changeCb, _cache, ignoreRegs)
        }
    }, ignoreRegs)
}