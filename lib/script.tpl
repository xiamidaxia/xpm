/** {{family}}/{{name}} **/
xpm.define("{{family}}/{{name}}", [{{{requireStr}}}], function(_module){
{{#each stylesheet}}
_module.addStyle("{{{this.content}}}")
{{/each}}
{{#each template}}
_module.addFile("{{{this.path}}}", function(require, exports, module){
    module.exports = "{{{this.content}}}"
})
{{/each}}
{{#each image}}
_module.addFile("{{{this.path}}}", function(require, exports, module){
    var image = new Image
    image.src = _module.getFullPath("{{{this.path}}}")
    module.exports = image
})
{{/each}}
{{#each javascript}}
_module.addFile("{{{path}}}", function(require, exports, module) {
{{{content}}}
})
{{/each}}
{{#each coffee}}
_module.addFile("{{{path}}}", function(require, exports, module) {
{{{content}}}
})
{{/each}}
_module.setMainPath('{{{mainpath}}}')
{{#if main_preload}}
_module.preload()
{{/if}}
//_module.runTest()

})