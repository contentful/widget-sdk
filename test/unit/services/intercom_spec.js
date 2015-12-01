'use strict';

describe('Intercom service', function () {
  var $window, intercom, $windowIntercomStub;

  function setGlobalIntercom (value) {
    $windowIntercomStub = $window.Intercom = value;

    inject(function ($rootScope, $controller, _intercom_) {
      intercom = _intercom_;
    });
  }

  beforeEach(function () {
    module('contentful/test');
    $window = this.$inject('$window');
  });

  describe('with $window.Intercom defined', function () {
    beforeEach(function () {
      setGlobalIntercom(sinon.stub());
      intercom.open();
    });

    describe('.open()', function () {
      it('calls $window.Intercom with "showNewMessage"', function () {
        expect($windowIntercomStub.called).toBe(true);
        expect($windowIntercomStub.calledWithExactly('showNewMessage')).toBe(true);
      });
    });

    describe('isLoaded()', function () {
      it('does nothing and trows no error', function () {
        expect(intercom.isLoaded()).toBe(true);
      });
    });
  });

  describe('with $window.Intercom undefined', function () {
    beforeEach(function () {
      setGlobalIntercom(undefined);
      intercom.open();
    });

    describe('.open()', function () {
      it('does nothing and trows no error', function () {
        expect(true).toBe(true);
      });
    });

    describe('isLoaded()', function () {
      it('does nothing and trows no error', function () {
        expect(intercom.isLoaded()).toBe(false);
      });
    });
  });

});
