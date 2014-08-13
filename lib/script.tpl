/** {{family}}/{{name}} **/
xpm.define("{{family}}/{{name}}", [{{{requireStr}}}], function(_module){

{{{codes}}}
_module.setMainPath('{{{mainpath}}}')
{{#if main_preload}}
_module.preload()
{{/if}}
{{#if testFiles}}
_module.addTestFiles({{{testFiles}}})
{{/if}}
})