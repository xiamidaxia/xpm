/** {{family}}/{{name}} **/
xpm.define("/{{family}}/{{name}}", [{{{requireStr}}}], function(require, exports, module){

{{#each stylesheet}}
module._addStyle("{{{this.content}}}")
{{/each}}
{{#each template}}
module._addFile("{{{this.path}}}", function(){
    return "{{{this.content}}}"
})
{{/each}}
{{#each image}}
module._addFile("{{{this.path}}}", function(){
    return new Image(module.cwd + "/{{{this.path}}}")
})
{{/each}}
{{#each javascript}}
module._addFile("{{{path}}}", function() {
{{{content}}}
})
{{/each}}
module._run('{{{mainpath}}}')
module._runTest()

})