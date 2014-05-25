
var md5map = []
var isDebug = Meteor.isDebug
var s_domain = Meteor.s_domain  //can be as a CDN

//config seajs
seajs.config({
    paths: {
    },
    alias: {
    },
    preload: [],
    debug: isDebug,
    charset: "utf-8",
    base: s_domain,
    map: [
        function(url){
            var src = url;
            if (isDebug) { //debug模式不进行md5映射
                return url
            }
            if(typeof(md5map) === 'undefined'){
                md5map = [];
            }
            for(i=md5map.length;i--;){
                url = url.replace(md5map[i][0],md5map[i][1]);
            }
            // 从 dist 里的文件发起的请求会多一个dist
            url = url.replace(/(\/+dist)+/,'/dist');
            if(src==url && /dist/.test(url)){
                url = url.replace('/dist', '');
            }
            return url;
        }
    ]
    //base:
})