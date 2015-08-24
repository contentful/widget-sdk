'use strict';

describe('otFieldPresenceController', function(){

  beforeEach(function(){
    module('contentful/test', function ($provide) {
      $provide.removeController('otDocPresenceController');
    });
    this.mockPresence = {
      userId: 'fieldId'
    };
    var otPresence = { fields: {} };
    otPresence.fields['fields.fieldId.en'] = this.mockPresence;

    var el = this.$compile(
      '<div ot-doc-presence>'+
        '<div ot-field-presence="[\'fields\', \'fieldId\', \'en\']"></div>'+
      '</div>', {
      otPresence: otPresence
    });
    this.$scope = el.scope();
    this.$scope.$digest();
  });

  it('otFieldPresenceId is set', function(){
    expect(this.$scope.otFieldPresenceId).toEqual('fields.fieldId.en');
  });

  it('otFieldPresence is set', function(){
    expect(this.$scope.otFieldPresence).toEqual(this.mockPresence);
  });

  it('presence changes are detected', function(){
    this.$scope.otPresence = { fields: {} };
    this.$scope.otPresence.fields['fields.fieldId.fr'] = {};
    this.$scope.$digest();
    expect(this.$scope.otFieldPresence).not.toEqual(this.mockPresence);
  });

});
