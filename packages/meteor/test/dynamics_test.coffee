Fiber = require('fibers')
CurrentFoo = new Meteor.EnvironmentVariable
it "meteor - dynamic variables", (done)->
    #work inside the Fiber
    Fiber(()->
        expect(CurrentFoo.get(), undefined)
        CurrentFoo.withValue(17, ()->
            expect(CurrentFoo.get()).eql(17)

            CurrentFoo.withValue(22, ()->
                expect(CurrentFoo.get(), 22)
            )
            expect(CurrentFoo.get()).eql(17)
        )
        expect(CurrentFoo.get(), undefined)
    ).run()
    done()
it "meteor - bindEnvironment", (done)->
    #work inside the Fiber
    Fiber(()->
        raised_f = null
        f = CurrentFoo.withValue(17, ()->
            return Meteor.bindEnvironment((flag)->
                expect(CurrentFoo.get()).eql(17)
                throw 'test' if flag
                return 12
            , (e)->
                expect(CurrentFoo.get()).eql(17)
                raised_f = e
            )
        )
        test_f = ()->
            raised_f = null
            expect(f(false)).eql(12)
            expect(raised_f).eql(null)
            expect(f(true)).eql(undefined)
            expect(raised_f).eql('test')
        # At top level
        expect(CurrentFoo.get()).eql(undefined)
        test_f()
        #inside a withValue
        CurrentFoo.withValue(22, ()->
            expect(CurrentFoo.get()).eql(22)
            test_f()
            expect(CurrentFoo.get()).eql(22)
        )
        expect(CurrentFoo.get()).eql(undefined)
        # Multiple environment-bound functions on the stack (in the nodejs
        # implementation, this needs to avoid creating additional fibers)
        raised_g = null
        g = CurrentFoo.withValue(99, ()->
            return Meteor.bindEnvironment((flag)->
                expect(CurrentFoo.get()).eql(99)
                throw 'trial' if flag
                test_f()
                return 88
            , (e)->
                expect(CurrentFoo.get()).eql(99)
                raised_g = e
            )
        )
        test_g = ()->
            raised_g = null
            expect(g(false)).eql(88)
            expect(raised_g).eql(null)
            expect(g(true)).eql(undefined)
            expect(raised_g).eql('trial')
        test_g()
        CurrentFoo.withValue(77, ->
            expect(CurrentFoo.get()).eql(77)
            test_g()
            expect(CurrentFoo.get()).eql(77)
        )
        expect(CurrentFoo.get()).eql(undefined)
    ).run()
    done()
