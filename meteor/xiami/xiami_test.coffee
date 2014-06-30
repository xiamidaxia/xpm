describe.only "xiami", ()->
    it "xiami - util", (done)->
        a = util.camelCase("Mobile Safari")

        test.equal(a, "mobileSafari")
        done()
    it "xiami - init", (done)->
        xiami = new Xiami({port:4000})
        console.log(xiami._opts)
        xiami.on("STARTED", ()->
            Log('is started!!')
        )
        xiami.run()
        done()