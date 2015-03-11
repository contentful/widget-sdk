'use strict';

describe('Available validations', function () {
  var availableValidations, stubs;
  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs(['perType']);
      $provide.constant('validation', {
        Validation : {
          perType: stubs.perType
        }
      });
    });
    inject(function (_availableValidations_) {
      availableValidations = _availableValidations_;
    });
  });

  it('validations are exposed', function() {
    expect(availableValidations.all).toBeDefined();
  });

  it('get type of a validation and filters out angular properties', function() {
    expect(availableValidations.type({size: {}, '$$hashKey': {}})).toEqual('size');
  });

  it('get name of a validation based on type', function() {
    expect(availableValidations.name({size: {}, '$$hashKey': {}})).toEqual('Length');
  });

  describe('get validations', function() {
    var validations;
    beforeEach(function() {
      stubs.perType.returns(['size', 'range', 'regexp', 'in', 'linkContentType', 'linkMimetypeGroup']);
    });

    describe('for a regular field', function() {
      beforeEach(function() {
        validations = availableValidations.forField({type: 'Text'});
      });

      it('gets all validations it should', function() {
        expect(validations).toEqual(availableValidations.all);
      });

      it('calls validation module', function() {
        sinon.assert.called(stubs.perType);
      });
    });

    describe('for an array field', function() {
      beforeEach(function() {
        validations = availableValidations.forField({type: 'Array', items: {}});
      });

      it('gets all validations it should', function() {
        expect(validations).toEqual(availableValidations.all);
      });

      it('calls validation module', function() {
        sinon.assert.called(stubs.perType);
      });
    });

  });


});
