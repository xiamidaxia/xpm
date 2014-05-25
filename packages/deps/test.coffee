describe "deps", ->
    it "deps - run", (done)->
        d = new Deps.Dependency
        x = 0
        handle = Deps.autorun(->
            d.depend()
            ++x
        )
        expect(x).eql(1)
        Deps.flush()
        expect(x).eql(1)
        #changed will trigger invalidate,
        #then invalidate trigger requireFlush
        d.changed()
        expect(x).eql(1)
        Deps.flush()
        expect(x).eql(2)
        d.changed()
        expect(x).eql(2)
        Deps.flush()
        expect(x).eql(3)
        d.changed()
        # Prevent the function from running further.
        handle.stop()
        Deps.flush()
        expect(x).eql(3)
        d.changed()
        Deps.flush()
        expect(x).eql(3)

        Deps.autorun((internalHandle)->
            d.depend()
            ++x
            if (x == 6)
                internalHandle.stop()
        )
        expect(x).eql(4)
        d.changed()
        Deps.flush()
        expect(x).eql(5)
        d.changed()
        #Increment to 6 and stop.
        Deps.flush()
        expect(x).eql(6)
        d.changed()
        Deps.flush()
        #Still 6!
        expect(x).eql(6)
        expect(->
            Deps.autorun()
        ).throwError()
        expect(->
            Deps.autorun({})
        ).throwError()
        done()
    it "deps - nested run", (done) ->
        a = new Deps.Dependency
        b = new Deps.Dependency
        c = new Deps.Dependency
        d = new Deps.Dependency
        e = new Deps.Dependency
        f = new Deps.Dependency
        buf = ""
        c2 = null
        c1 = Deps.autorun(->
            a.depend()
            buf += "a"
            Deps.autorun(->
                b.depend()
                buf += 'b'
                Deps.autorun(->
                    c.depend()
                    buf += 'c'
                    c2 = Deps.autorun(->
                        d.depend()
                        buf += 'd'
                        Deps.autorun(->
                            e.depend()
                            buf += 'e'
                            Deps.autorun(->
                                f.depend()
                                buf += 'f'
                            )
                        )
                        Deps.onInvalidate(->
                            #only run once
                            c2.stop()
                        )
                    )
                )
            )
            Deps.onInvalidate((c1)->
                c1.stop()
            )
        )
        _expect = (str)->
            expect(buf).eql(str)
            buf = ""
        changeAndExpect = (v, str) ->
            v.changed()
            Deps.flush()
            expect(str)
        _expect('abcdef')
        b.changed()
        #didn't flush yet
        _expect('')
        Deps.flush()
        _expect('bcdef')
        c.changed()
        Deps.flush()
        _expect('cdef')
        #should cause running
        changeAndExpect(e, 'ef')
        changeAndExpect(f, 'f')
        #invalidate inner context
        changeAndExpect(d, '')
        #no more running!
        changeAndExpect(e, '')
        changeAndExpect(f, '')
        #rerun C
        changeAndExpect(c, 'cdef')
        changeAndExpect(e, 'ef')
        changeAndExpect(f, 'f')
        #rerun B
        changeAndExpect(b, 'bcdef')
        changeAndExpect(e, 'ef')
        changeAndExpect(f, 'f')
        #kill A
        a.changed()
        changeAndExpect(f, '')
        changeAndExpect(e, '')
        changeAndExpect(d, '')
        changeAndExpect(c, '')
        changeAndExpect(b, '')
        changeAndExpect(a, '')

        expect(a.hasDependents()).not.ok()
        expect(b.hasDependents()).not.ok()
        expect(c.hasDependents()).not.ok()
        expect(d.hasDependents()).not.ok()
        expect(e.hasDependents()).not.ok()
        expect(f.hasDependents()).not.ok()
        done()
    it "deps - flush", (done)->
        buf = ""
        c1 = Deps.autorun((c)->
            buf += 'a'
            #invalidate first time
            if (c.firstRun)
                c.invalidate()
        )
        expect(buf).eql('a')
        Deps.flush()
        expect(buf).eql('aa')
        Deps.flush()
        expect(buf).eql('aa')
        c1.stop()
        Deps.flush()
        expect(buf, 'aa')

        buf = ""
        c2 = Deps.autorun((c)->
            buf += 'a'
            #invalidate first time
            if (c.firstRun)
                c.invalidate()
            Deps.onInvalidate(()->
                buf += "*"
            )
        )
        expect(buf).eql('a*')
        Deps.flush()
        expect(buf).eql('a*a')
        c2.stop()
        expect(buf).eql('a*a*')
        Deps.flush()
        expect(buf).eql('a*a*')

        buf = ""
        c3 = Deps.autorun((c)->
            buf += 'a'
            #invalidate first time
            if (c.firstRun)
                c.invalidate()
            Deps.afterFlush(->
                buf += (if Deps.active then "1" else "0")
            )
        )
        Deps.afterFlush(->
            buf += 'c'
        )
        c4 = Deps.autorun((c)->
            c4 = c
            buf += 'b'
        )

        Deps.flush()
        expect(buf).eql('aba0c0')
        c3.stop()
        c4.stop()
        Deps.flush()

        ran = false
        Deps.afterFlush((arg)->
            ran = true
            expect(arg).to.be(undefined)
            expect(->
                Deps.flush() #illegal nested flush
            ).throwError()
        )
        Deps.flush()
        expect(ran).to.be.ok()
        expect(->
            Deps.autorun(->
                Deps.flush() #illegal to flush from a computation
            )
        ).throwError()
        done()

    it "deps - lifecycle", (done)->
        expect(Deps.active).not.ok()
        expect(Deps.currentComputation).to.be(null)
        runCount = 0
        firstRun = true
        buf = []
        cbId = 1
        makeCb = ()->
            id = cbId++
            return ->
                buf.push(id)
        shouldStop = false
        c1 = Deps.autorun((c)->
            expect(Deps.active).ok()
            expect(c).eql(Deps.currentComputation)
            expect(c.stopped).not.ok()
            expect(c.invalidated).not.ok()
            expect(c.firstRun).eql(firstRun)
            Deps.onInvalidate(makeCb()) # 1, 6, ...
            Deps.afterFlush(makeCb()) # 2, 7, ...

            Deps.autorun((x) ->
                x.stop()
                c.onInvalidate(makeCb()) # 3, 8, ...

                Deps.onInvalidate(makeCb()) # 4, 9, ...
                Deps.afterFlush(makeCb()) # 5, 10, ...
            )
            runCount++
            c.stop() if shouldStop
        )
        firstRun = false
        expect(runCount).eql(1)
        expect(buf).eql([4])
        c1.invalidate()
        expect(runCount).eql(1)
        expect(c1.invalidated).ok()
        expect(c1.stopped).not.ok()
        expect(buf).eql([4, 1, 3])
        Deps.flush()
        expect(runCount).eql(2)
        expect(c1.invalidated).not.ok()
        expect(buf).eql([4, 1, 3, 9, 2, 5, 7, 10])

        #expect self-stop
        buf.length = 0
        shouldStop = true
        c1.invalidate()
        expect(buf).eql([6, 8])
        Deps.flush()
        expect(buf).eql([6, 8, 14, 11, 13, 12, 15])
        done()

    it "deps - onInvalidate", (done)->
        buf = ""
        c1 = Deps.autorun(->
            buf += "*"
        )
        append = (x)->
            return ->
                expect(Deps.active).not.ok()
                buf += x
        c1.onInvalidate(append('a'))
        c1.onInvalidate(append('b'))
        expect(buf).eql('*')
        Deps.autorun((me)->
            Deps.onInvalidate(append('z'))
            me.stop()
            expect(buf).eql('*z')
            c1.invalidate()
        )
        expect(buf).eql('*zab')
        c1.onInvalidate(append('c'))
        c1.onInvalidate(append('d'))
        expect(buf).eql('*zabcd')
        Deps.flush()
        expect(buf).eql('*zabcd*')

        #afterFlush ordering
        buf = ''
        c1.onInvalidate(append('a'))
        c1.onInvalidate(append('b'))
        Deps.afterFlush(->
            append('x')()
            c1.onInvalidate(append('c'))
            c1.invalidate()
            Deps.afterFlush(->
                append('y')()
                c1.onInvalidate(append('d'))
                c1.invalidate()
            )
        )
        Deps.afterFlush(->
            append('z')()
            c1.onInvalidate(append('e'))
            c1.invalidate()
        )
        expect(buf).eql('')
        Deps.flush()
        expect(buf).eql('xabc*ze*yd*')

        buf = ""
        c1.onInvalidate(append('m'))
        c1.stop()
        expect(buf).eql('m')
        Deps.flush()
        done()
    it 'deps - invalidate at flush time', (done)->
        buf = []
        Deps.afterFlush(()->
            buf.push('C')
        )
        #When c1 is invalidated, it invalidates c2, then stops.
        c1 = Deps.autorun((c)->
            if (!c.firstRun)
                buf.push 'A'
                c2.invalidate()
                c.stop()
        )
        c2 = Deps.autorun((c)->
            if (!c.firstRun)
                buf.push('B')
                c.stop()
        )
        c1.invalidate()
        Deps.flush()
        expect(buf.join('')).eql('ABC')
        done()
    it 'deps - throwFirstError', (done)->
        # doesn't throw; logs instead.
        Meteor._suppress_log(1);
        d = new Deps.Dependency
        Deps.autorun((c)->
            d.depend()
            if (!c.firstRun)
                throw new Error('foo')
        )
        d.changed()
        # doesn't throw; logs instead.
        Deps.flush()
        d.changed()
        expect(()->
            Deps.flush({_throwFirstError: true})
        ).throwError()
        done()