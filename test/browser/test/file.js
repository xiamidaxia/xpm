describe("test in browser", function() {
    it ('xpm', function(done) {
        xpm.use("client_pack/pack2", function(pack2) {
            if (pack2) done()
        })
    })
})
