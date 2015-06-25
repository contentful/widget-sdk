'use strict';

describe('Widget checks service', function() {
  var $q, $rootScope;
  var widgetChecks;
  var kalturaCredentials;

  beforeEach(function() {
    module('contentful/test');
    $q                  = this.$inject('$q');
    $rootScope          = this.$inject('$rootScope');
    widgetChecks        = this.$inject('widgetChecks');
    kalturaCredentials  = this.$inject('kalturaCredentials');
  });

  describe('getMisconfigured', function() {
    it('should return misconfigured widgets only', function() {
      var misconfigured = {id: 'third', misconfigured: true};
      var widgets = [{id: 'first'}, {id: 'second'}, misconfigured, {id: 'last', misconfigured: false}];
      var result = widgetChecks.getMisconfigured(widgets);

      expect(result['third']).toEqual(misconfigured);
      expect(Object.keys(result).length).toEqual(1);
    });
  });

  describe('markMisconfigured', function() {
    describe('kalturaEditor', function() {

      pit('should "pass through" widgets array', function() {
        var widgets = [{id: 'test'}];

        return widgetChecks.markMisconfigured(widgets).then(function(result) {
          expect(result).toEqual(widgets);
        });
      });

      pit('should not mark as misconfigured for 200 response', function() {
        var widgets = [{id: 'kalturaEditor'}];

        sinon.stub(kalturaCredentials, 'get').returns($q.when(200));

        return widgetChecks.markMisconfigured(widgets).then(function(result) {
          expect(result.length).toEqual(1);
          expect(result[0].misconfigured).toBeFalsy();
        });
      });

      pit('should mark as misconfigured for non-200 response', function() {
        var widgets = [{id: 'kalturaEditor'}, {id: 'anotherOne'}];

        sinon.stub(kalturaCredentials, 'get').returns($q.reject(404));

        return widgetChecks.markMisconfigured(widgets).then(function(result) {
          expect(result.length).toEqual(2);
          expect(result[0].misconfigured).toEqual(true);
          expect(result[1].misconfigured).toBeFalsy();
        });
      });

    });
  });
});
