global.can_use_global = true
if (global.checkRequireCache) {
    module.exports = "require twice"
} else {
    module.exports = "require once"
}
