/** {{family}}/{{name}} **/
xpm.define("{{family}}/{{name}}", [{{{requireStr}}}], function(_module){

{{{codes}}}
_module.setMainPath('{{{mainpath}}}')
{{#if main_preload}}
_module.preloadMain()
{{/if}}
{{#if all_preload}}
_module.preloadAll()
{{/if}}
{{#if testFiles}}
_module.addTestFiles({{{testFiles}}})
{{/if}}
})