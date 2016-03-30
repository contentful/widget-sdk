'use strict';

describe('sdkInfoProvider', function () {
  beforeEach(function () {
    module('contentful/test');
    this.sdkInformation = this.$inject('sdkInfoProvider');
  });

  it('returns a list containing all elements', function() {
    var data = this.sdkInformation.get();
    expect(data.length).toBe(6);    
  });

  it('returns an empty data object when called without arguments', function() {
    var data = this.sdkInformation.get();
    _.forEach(data, function(language) {
      expect(language.data).toEqual({});
    });
  });
 
  it('filters data object', function() {
    var keys = ['documentation'];
    var data = this.sdkInformation.get(keys);
    data.forEach(function(language) {
      expect(_.keys(language.data)).toEqual(keys);
    });
  });

  it('removes invalid keys', function() {
    var keys = ['deliveryApi', 'documentation', 'invalid'];
    var data = this.sdkInformation.get(keys);
    expect(_.keys(data[0].data)).toEqual(['deliveryApi', 'documentation']);
    expect(_.keys(data[5].data)).toEqual(['documentation']);
  });

});
