exports.default_config = {
    "port"               : 3000,
    // development || production
    "env"                : "development",
    "mongo_url"          : "mongodb://localhost/test",
    "compress"           : true,
    "view_engine"        : "jade",
    "trust_proxy"        : false,
    "jsonp_callback_name": "cb",
    "views"              : "",
    "favicon"            : "",
    "view_cache"         : false,
    "client_path"        : "",
    "static_maxage"      : 3600000 * 24 * 30,
}