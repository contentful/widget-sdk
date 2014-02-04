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

  describe('UIID', function () {
    beforeEach(function () {
      scope.contentType = {
        data: {
          fields: [
            {id: 'foo'},
            {id: 'bar', uiid: 'aaa'}
          ]
        }
      };
    });

    it('should create and return uiids for fields that don\'t have one', function () {
      scope.$apply();
      expect(scope.fieldList[0].uiid).toBeTruthy();
    });

    it('should not create, just return uiids for fields that already have one', function () {
      scope.$apply();
      expect(scope.fieldList[1].uiid).toBe('aaa');
    });
  });

  describe('sets UIIDs on otDoc', function () {
    beforeEach(function () {
      scope.contentType = {
        data: {
          fields: [
            {id: 'foo'},
            {id: 'yawn'},
            {id: 'bar', uiid: 'aaa'}
          ]
        }
      };
      scope.otUpdateEntity = sinon.stub();
      scope.$apply();
      scope.otDoc = {
        setAt: sinon.stub().yields(null)
      };
      scope.$digest();
    });

    it('sets uiid on otdoc fields', function () {
      expect(scope.otDoc.setAt).toBeCalledTwice();
    });

    it('updates the entity', function () {
      expect(scope.otUpdateEntity).toBeCalledOnce();
    });
  });

  describe('does not set UIIDs on otDoc if already there', function () {
    beforeEach(function () {
      scope.contentType = {
        data: {
          fields: [
            {id: 'foo', uiid: 'bbb'},
            {id: 'bar', uiid: 'aaa'}
          ]
        },

      };
      scope.otUpdateEntity = sinon.stub();
      scope.$apply();
      scope.otDoc = {
        setAt: sinon.stub().yields(null)
      };
      scope.$digest();
    });

    it('sets uiid on otdoc fields', function () {
      expect(scope.otDoc.setAt).not.toBeCalled();
    });

    it('updates the entity', function () {
      expect(scope.otUpdateEntity).not.toBeCalledOnce();
    });
  });

  describe('toggle a field', function () {
    var field;
    beforeEach(function () {
      field = {uiid: 123};
      scope.toggleField(field);
    });

    it('field is open', function () {
      expect(scope.isFieldOpen(field)).toBeTruthy();
    });

    it('field is closed', function () {
      scope.toggleField(field);
      expect(scope.isFieldOpen(field)).toBeFalsy();
    });
  });

  describe('open a field', function () {
    var field;
    beforeEach(function () {
      field = {uiid: 123};
    });

    it('field is closed', function () {
      expect(scope.isFieldOpen(field)).toBeFalsy();
    });

    it('field is open', function () {
      scope.openField(field);
      expect(scope.isFieldOpen(field)).toBeTruthy();
    });
  });

  describe('click a field', function () {
    var field;
    beforeEach(function () {
      field = {uiid: 123};
      scope.openField = sinon.stub();
      scope.fieldClicked(field);
    });

    it('field is opened', function () {
      expect(scope.openField).toBeCalledWith(field);
    });
  });

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
    expect(scope.fieldIsPublished({uiid: 123})).toBeFalsy();
  });

  it('field is published with uiids', function () {
    scope.publishedContentType = {
      data: {
        fields: [
          {uiid: 123}
        ]
      }
    };
    scope.publishedUIIDs = [123];
    scope.$digest();
    expect(scope.fieldIsPublished({uiid: 123})).toBeTruthy();
  });

  it('field is not published with uiids', function () {
    scope.publishedContentType = {
      data: {
        fields: [
          {uiid: 123}
        ]
      }
    };
    scope.publishedUIIDs = [];
    scope.$digest();
    expect(scope.fieldIsPublished({uiid: 123})).toBeFalsy();
  });

  describe('if fields have no uiids', function () {
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

    it('field is not published when fields exist with same ids and various fields exist with the same type', function () {
      scope.contentType.data.fields.push({id: 123, type: 'int'});
      scope.publishedContentType = {
        data: {
          fields: [
            {id: 123, type: 'text'}
          ]
        }
      };
      scope.publishedIds = [123];
      scope.$digest();
      expect(scope.fieldIsPublished({id: 123, type: 'text'})).toBeFalsy();
    });

    it('field is not published when type of the field doesnt match the published fields with same id', function () {
      scope.contentType.data.fields.push({id: 123, type: 'int'});
      scope.publishedContentType = {
        data: {
          fields: [
            {id: 123, type: 'int'}
          ]
        }
      };
      scope.publishedIds = [123];
      scope.$digest();
      expect(scope.fieldIsPublished({id: 123, type: 'text'})).toBeFalsy();
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
      scope.openField = sinon.stub();
      scope.$digest();

      $rootScope.$broadcast('fieldAdded', 0);
    }));

    it('calls openField with new field', function () {
      expect(scope.openField).toBeCalledWith({id: 'foo'});
    });
  });

});
