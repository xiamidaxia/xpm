/** {{family}}/{{packname}} **/
xpm.define("/{{family}}/{{packname}}", [{{{requireStr}}}], function(require, exports, module){

//require and alias

//styles
{{#each stylesheet}}
module._addStyle("{{{this.content}}}")
{{/each}}

//templates
{{#each template}}
module._addFile("{{{this.path}}}", function(){
    return "{{{this.content}}}"
})
{{/each}}

//images
{{#each image}}
module._addFile("{{{this.path}}}", function(){
    return new Image(module.cwd + "/{{{this.path}}}")
})
{{/each}}

{{#each javascript}}
// {{path}}
module._addFile("{{{path}}}", function() {
{{{content}}}
})

{{/each}}

//run main
module._run('{{{mainpath}}}')

module._runTest()

})