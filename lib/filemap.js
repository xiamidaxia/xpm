/**
 //  - manifest: array of resources to serve with HTTP, each an object:
 //    - path: path of file relative to program.json
 //    - where: "client"
 //    - type: "js", "css", or "asset"
 //    - cacheable: is it safe to ask the browser to cache this file (boolean)
 //    - url: relative url to download the resource, includes cache busting
 //        parameter when used
 //    - size: size of file in bytes
 //    - hash: sha1 hash of the file contents
 //    - sourceMap: optional path to source map file (relative to program.json)
 */
 /**
  * path: "packages/deps/file1.js"
  * type: "js"
  * cacheable: true
  * url: "/static/packages/deps-abcdefg.js"
  * size: 123144
  * hash:
 **/

var filemap = {}
var _ = require('underscore')

_.extend(filemap, {
    add: function() {

    }
})
