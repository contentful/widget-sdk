const { sinon, expect, describeAttachHandlerMember } = require('../helpers')

const FieldLocale = require('../../lib/field-locale')

describe('FieldLocale', () => {
  const info = {
    id: 'some-field',
    locale: 'en-US',
    type: 'Array',
    required: false,
    validations: 'VALIDATIONS',
    items: {
      type: 'Link',
      linkType: 'Entry',
      validations: 'VALIDATIONS OF ITEMS'
    }
  }
  let channelStub
  let field

  beforeEach(() => {
    channelStub = {
      _handlers: {},
      addHandler: function(method, cb) {
        this._handlers[method] = cb
      },
      call: sinon.stub(),
      receiveMethod: function(method, params) {
        this._handlers[method](...params)
      }
    }

    const infoCopy = JSON.parse(JSON.stringify(info))
    field = new FieldLocale(channelStub, infoCopy)
  })

  describe('.id', () => {
    it('is equal to info.id', () => {
      expect(field.id).to.equal(info.id)
    })
  })

  describe('.type', () => {
    it('is equal to info.type', () => {
      expect(field.type).to.equal(info.type)
    })
  })

  describe('.locale', () => {
    it("is set to the same value as given to first constructor arg's .locale", () => {
      expect(field.locale).to.equal(info.locale)
    })
  })

  describe('.required', () => {
    it('is equal to info.required', () => {
      expect(field.required).to.equal(info.required)
    })
  })

  describe('.validations', () => {
    it('is equal to info.validations', () => {
      expect(field.validations).to.equal(info.validations)
    })
  })

  describe(`.items`, () => {
    it(`is set to the same value as info.items`, () => {
      expect(field.items).to.deep.equal(info.items)
    })

    it('is skipped on the object if not defined in info', () => {
      const noItemsInfo = JSON.parse(JSON.stringify(info))
      delete noItemsInfo.items
      const noItemsField = new FieldLocale(channelStub, noItemsInfo)
      expect(noItemsField.items).to.equal(undefined)
    })
  })

  describe('.getValue()', () => {
    it('returns the most recently received value', () => {
      channelStub.receiveMethod('valueChanged', ['some-field', 'en-US', 'VAL1'])
      expect(field.getValue()).to.equal('VAL1')

      channelStub.receiveMethod('valueChanged', ['some-field', 'en-US', 'VAL2'])
      expect(field.getValue()).to.equal('VAL2')
    })
  })

  describe('.setValue(value)', () => {
    testValueMethods('setValue', 'new-value')
  })

  describe('.removeValue()', () => {
    testValueMethods('removeValue')
  })

  describe('.setInvalid()', () => {
    it('invokes channel.call("setInvalid", ...)', () => {
      field.setInvalid(true)
      sinon.assert.calledWithExactly(channelStub.call, 'setInvalid', true, info.locale)
    })
  })

  describe('.onIsDisabledChanged(handler)', () => {
    testChannelSignal('onIsDisabledChanged', 'isDisabledChanged')
  })

  describe('.onSchemaErrorsChanged(handler)', () => {
    testChannelSignal('onSchemaErrorsChanged', 'schemaErrorsChanged')
  })

  describe('.onValueChanged(handler)', () => {
    describeAttachHandlerMember('default behaviour', () => {
      return field.onValueChanged(() => {})
    })

    it('calls handler immediately on attach with most recently received value', () => {
      channelStub.receiveMethod('valueChanged', ['some-field', 'en-US', 'VAL1'])
      const spy1 = sinon.spy()
      field.onValueChanged(spy1)
      sinon.assert.calledOnce(spy1)
      sinon.assert.calledWithExactly(spy1, 'VAL1')

      channelStub.receiveMethod('valueChanged', ['some-field', 'en-US', 'VAL2'])
      const spy2 = sinon.spy()
      field.onValueChanged(spy2)
      sinon.assert.calledOnce(spy2)
      sinon.assert.calledWithExactly(spy2, 'VAL2')
    })

    it('calls handler when value change is received', () => {
      const spy = sinon.spy()
      field.onValueChanged(spy)
      spy.resetHistory()

      channelStub.receiveMethod('valueChanged', ['some-field', 'en-US', 'VAL1'])
      sinon.assert.calledOnce(spy)
      sinon.assert.calledWithExactly(spy, 'VAL1')

      channelStub.receiveMethod('valueChanged', ['some-field', 'en-US', 'VAL2'])
      sinon.assert.calledTwice(spy)
      sinon.assert.calledWithExactly(spy, 'VAL2')
    })

    it('does not call handler when other field value changes', function() {
      const spy = sinon.spy()
      field.onValueChanged(spy)
      spy.resetHistory()

      channelStub.receiveMethod('valueChanged', ['other-field', 'en-US', 'VAL'])
      channelStub.receiveMethod('valueChanged', ['some-field', 'other-locale', 'VAL'])
      sinon.assert.notCalled(spy)
    })
  })

  function testValueMethods(method, newValue) {
    beforeEach(() => {
      field[method](newValue)
    })

    it(`sets the value to ${newValue}`, () => {
      expect(field.getValue()).to.equal(newValue)
    })

    it(`invokes channel.call("${method}", ...)`, () => {
      if (newValue === undefined) {
        expect(channelStub.call).to.have.been.calledWithExactly(method, field.id, info.locale)
      } else {
        expect(channelStub.call).to.have.been.calledWithExactly(
          method,
          field.id,
          info.locale,
          newValue
        )
      }
    })

    it('returns the promise returned by internal channel.call()', () => {
      channelStub.call.withArgs(method).returns('PROMISE')
      expect(field[method]('val')).to.equal('PROMISE')
    })

    it('calls onValueChanged handler', function() {
      const spy = sinon.spy()
      field.onValueChanged(spy)
      spy.resetHistory()

      field.setValue('VAL1')
      sinon.assert.calledOnce(spy)
      sinon.assert.calledWithExactly(spy, 'VAL1')

      field.setValue('VAL2')
      sinon.assert.calledTwice(spy)
      sinon.assert.calledWithExactly(spy, 'VAL2')
    })
  }

  function testChannelSignal(method, message) {
    it('calls handler when method is received', () => {
      const cb = sinon.spy()

      field[method](cb)
      cb.resetHistory()
      channelStub.receiveMethod(message, ['VALUE'])
      sinon.assert.calledOnce(cb)
      sinon.assert.calledWithExactly(cb, 'VALUE')
    })

    it('calls handler with last received message', () => {
      channelStub.receiveMethod(message, ['VALUE'])
      const cb = sinon.spy()
      field[method](cb)
      sinon.assert.calledOnce(cb)
      sinon.assert.calledWithExactly(cb, 'VALUE')
    })
  }
})
