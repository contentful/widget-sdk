'use strict';

describe('ContentTypeFieldList Controller', function () {
  var controller, scope;
  beforeEach(function () {
    module('contentful/test');
    inject(function ($compile, $rootScope, $controller){
      scope = $rootScope.$new();
      controller = $controller('ContentTypeFieldListCtrl', {$scope: scope});
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  it('get field type params', function () {
    expect(scope.fieldTypeParams({
      type: 'type',
      linkType: 'linkType',
      items: {
        type: 'itemsType',
        linkType: 'itemsLinkType'
      }
    })).toEqual([
      'type', 'linkType', 'itemsType', 'itemsLinkType'
    ]);
  });

  it('field is not published', function () {
    expect(scope.fieldIsPublished({id: 123})).toBeFalsy();
  });

  it('field is published with ids', function () {
    scope.publishedContentType = {
      data: {
        fields: [
          {id: 123}
        ]
      }
    };
    scope.publishedIds = [123];
    scope.$digest();
    expect(scope.fieldIsPublished({id: 123})).toBeTruthy();
  });

  it('field is not published with ids', function () {
    scope.publishedContentType = {
      data: {
        fields: [
          {id: 123}
        ]
      }
    };
    scope.publishedIds = [];
    scope.$digest();
    expect(scope.fieldIsPublished({id: 123})).toBeFalsy();
  });

  describe('if fields have no ids', function () {
    beforeEach(function () {
      scope.contentType = {
        data: {
          fields: [
            {id: 123, type: 'text'},
            {id: 456, type: 'text'}
          ]
        }
      };
    });

    it('field is published with different ids but same type', function () {
      scope.publishedContentType = {
        data: {
          fields: [
            {id: 123, type: 'text'},
            {id: 456, type: 'text'}
          ]
        }
      };
      scope.publishedIds = [123, 456];
      scope.$digest();
      expect(scope.fieldIsPublished({id: 123, type: 'text'})).toBeTruthy();
    });

    it('field is published with different ids and different types', function () {
      scope.publishedContentType = {
        data: {
          fields: [
            {id: 123, type: 'text'},
            {id: 456, type: 'int'}
          ]
        }
      };
      scope.publishedIds = [123, 456];
      scope.$digest();
      expect(scope.fieldIsPublished({id: 123, type: 'text'})).toBeTruthy();
    });
  });

  describe('display field', function () {
    var atStub, setStub;
    beforeEach(function () {
      atStub = sinon.stub();
      setStub = sinon.stub();
      scope.otDoc = {
        at: atStub
      };
      atStub.returns({
        set: setStub
      });
      scope.contentType = {
        data: {
          fields: [ {id: 'foo'} ]
        }
      };
    });

    describe('pick a new display field', function () {
      beforeEach(function () {
        setStub.yields(null);
      });

      it('should not pick a new if current is valid', function () {
        scope.contentType.data.fields[0].type = 'Text';
        scope.contentType.data.displayField = 'foo';
        scope.removeDisplayField = sinon.stub();
        scope.pickNewDisplayField();
        expect(setStub.called).toBe(false);
        expect(scope.contentType.data.displayField).toBe('foo');
      });

      it('should pick a new if current is invalid', function () {
        scope.contentType.data.displayField = 'foo';
        scope.contentType.data.fields.push({id: 'bar', type: 'Text'});
        scope.pickNewDisplayField();
        expect(setStub.calledWith('bar')).toBe(true);
        expect(scope.contentType.data.displayField).toBe('bar');
      });

      it('should pick a new if current is blank', function () {
        scope.contentType.data.displayField = null;
        scope.contentType.data.fields.push({id: 'bar', type: 'Text'});
        scope.pickNewDisplayField();
        expect(setStub.calledWith('bar')).toBe(true);
        expect(scope.contentType.data.displayField).toBe('bar');
      });

      it('should set to blank if invalid and no alternative available', function () {
        scope.contentType.data.displayField = 'bar';
        scope.pickNewDisplayField();
        expect(setStub.calledWith(null)).toBe(true);
        expect(scope.contentType.data.displayField).toBe(null);
      });
    });

    describe('sets a display field', function () {
      beforeEach(function () {
        setStub.callsArg(1);
        scope.setDisplayField({id: 'foo'});
      });

      it('display field is set on the content type', function () {
        expect(scope.contentType.data.displayField).toBe('foo');
      });

      it('set is called with field id', function () {
        expect(setStub).toBeCalledWith('foo');
      });
    });

    describe('fails to set a display field', function () {
      beforeEach(function () {
        setStub.callsArgWith(1, {});
        scope.setDisplayField({id: 'foo'});
      });

      it('display field is not set on the content type', function () {
        expect(scope.contentType.data.displayField).toBeUndefined();
      });

      it('set is called with field id', function () {
        expect(setStub).toBeCalledWith('foo');
      });
    });

    describe('removes a display field', function () {
      beforeEach(function () {
        scope.contentType.data.displayField = 'foo';
        setStub.callsArg(1);
        scope.removeDisplayField({id: 'foo'});
      });

      it('display field is removed from the content type', function () {
        expect(scope.contentType.data.displayField).toBeNull();
      });

      it('set is called with field id', function () {
        expect(setStub).toBeCalledWith(null);
      });
    });

    describe('fails to remove a display field from the content type', function () {
      beforeEach(function () {
        scope.contentType.data.displayField = 'foo';
        setStub.callsArgWith(1, {});
        scope.removeDisplayField({id: 'foo'});
      });

      it('display field is not set on the content type', function () {
        expect(scope.contentType.data.displayField).toBe('foo');
      });

      it('set is called with field id', function () {
        expect(setStub).toBeCalledWith(null);
      });
    });

  });

  describe('Validation errors', function () {
    beforeEach(function () {
      scope.contentType = {
        data: {
          fields: [
            {id: 'foo', name: 'Foo'},
            {id: 'bar', name: 'Bar', disabled: true}
          ]
        }
      };
      scope.preferences = {};
    });

    it('should turn showDisabledFields on when a disabled field has an error', function () {
      expect(scope.preferences.showDisabledFields).toBeFalsy();
      scope.validationResult = {errors: [ {path: ['fields', 1]} ]};
      scope.$apply();
      expect(scope.preferences.showDisabledFields).toBe(true);
    });
  });

  describe('opens newly added fields', function () {
    beforeEach(inject(function ($rootScope) {
      scope.contentType = {
        data: {
          fields: [
            {id: 'foo'}
          ]
        }
      };
      scope.openAccordionItem = sinon.stub();
      scope.$digest();

      $rootScope.$broadcast('fieldAdded', 0);
    }));

    it('calls openAccordionItem with new field', function () {
      expect(scope.openAccordionItem).toBeCalledWith({id: 'foo'});
    });
  });

});
