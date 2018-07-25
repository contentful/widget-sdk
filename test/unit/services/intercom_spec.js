'use strict';

describe('Intercom service', () => {
  let $window, intercom, $windowIntercomStub;

  function setGlobalIntercom (value) {
    $windowIntercomStub = $window.Intercom = value;

    inject(($rootScope, $controller, _intercom_) => {
      intercom = _intercom_;
    });
  }

  beforeEach(function () {
    module('contentful/test');
    $window = this.$inject('$window');
  });

  describe('with $window.Intercom defined', () => {
    beforeEach(() => {
      setGlobalIntercom(sinon.stub());
      intercom.open();
    });

    describe('.open()', () => {
      it('calls $window.Intercom with "showNewMessage"', () => {
        expect($windowIntercomStub.called).toBe(true);
        expect($windowIntercomStub.calledWithExactly('showNewMessage')).toBe(true);
      });
    });

    describe('isLoaded()', () => {
      it('does nothing and trows no error', () => {
        expect(intercom.isLoaded()).toBe(true);
      });
    });
  });

  describe('with $window.Intercom undefined', () => {
    beforeEach(() => {
      setGlobalIntercom(undefined);
      intercom.open();
    });

    describe('.open()', () => {
      it('does nothing and trows no error', () => {
        expect(true).toBe(true);
      });
    });

    describe('isLoaded()', () => {
      it('does nothing and trows no error', () => {
        expect(intercom.isLoaded()).toBe(false);
      });
    });
  });

});
