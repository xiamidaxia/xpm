/** {{family}}/{{name}} **/
xpm.define("{{family}}/{{name}}", [{{{requireStr}}}], function(_module){

{{#each stylesheet}}
_module._addStyle("{{{this.content}}}")
{{/each}}
{{#each template}}
_module._addFile("{{{this.path}}}", function(){
    return "{{{this.content}}}"
})
{{/each}}
{{#each image}}
_module._addFile("{{{this.path}}}", function(){
    var image = new Image
    image.src = _module.getFullPath("{{{this.path}}}")
    return image
})
{{/each}}
{{#each javascript}}
_module._addFile("{{{path}}}", function(require, exports, module) {
{{{content}}}
})
{{/each}}
{{#each coffee}}
_module._addFile("{{{path}}}", function(require, exports, module) {
{{{content}}}
})
{{/each}}
_module._setMainPath('{{{mainpath}}}')
//_module._runTest()

})