'use strict';

describe('Field Settings Controller', function () {
  var controller, scope, stubs;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'perType', 'fieldTypeParams', 'fieldIsPublished', 'open', 'toIdentifier',
        'at', 'set', 'get', 'serverError', 'modifiedContentType', 'remove'
      ]);

      $provide.constant('validation', {
        Validation: {
          perType: stubs.perType
        }
      });

      $provide.value('validationDialog', {
        open: stubs.open
      });

      $provide.value('notification', {
        serverError: stubs.serverError
      });

      $provide.value('analytics', {
        modifiedContentType: stubs.modifiedContentType
      });

      $provide.constant('toIdentifier', stubs.toIdentifier);
    });
    inject(function ($controller, $rootScope) {
      scope = $rootScope.$new();

      scope.field = {};
      scope.pickNewDisplayField = sinon.stub();

      controller = $controller('CfFieldSettingsCtrl', {$scope: scope});
      scope.$digest();
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  it('has no validations', function() {
    expect(scope.hasValidations).toBeFalsy();
  });

  it('has validations', function() {
    scope.field.validations = [{validate: true}];
    scope.$digest();
    expect(scope.hasValidations).toBeTruthy();
  });

  it('has items validations', function() {
    scope.field.items = {
      validations: [{validate: true}]
    };
    scope.$digest();
    expect(scope.hasValidations).toBeTruthy();
  });

  describe('on fieldTypeParams changes', function() {
    beforeEach(function() {
      scope.fieldTypeParams = stubs.fieldTypeParams;
      stubs.fieldTypeParams.returns({});
    });

    it('validations are available', function() {
      stubs.perType.returns([{}]);
      scope.$digest();
      expect(scope.validationsAvailable).toBeTruthy();
    });

    it('validations are not available', function() {
      stubs.perType.returns([]);
      scope.$digest();
      expect(scope.validationsAvailable).toBeFalsy();
    });
  });

  describe('gets published status', function() {
    beforeEach(function() {
      scope.fieldIsPublished = stubs.fieldIsPublished;
    });

    it('is true', function() {
      stubs.fieldIsPublished.returns(true);
      scope.$digest();
      expect(scope.published).toBeTruthy();
    });

    it('is false', function() {
      stubs.fieldIsPublished.returns(false);
      scope.$digest();
      expect(scope.published).toBeFalsy();
    });
  });

  describe('status tooltip text', function() {
    it('is disabled', function() {
      scope.published = true;
      scope.field.disabled = true;
      scope.$digest();
      expect(scope.statusTooltipText()).toMatch(/disabled/i);
    });

    it('is active', function() {
      scope.published = true;
      scope.field.disabled = false;
      scope.$digest();
      expect(scope.statusTooltipText()).toMatch(/active/i);
    });

    it('is new', function() {
      scope.published = false;
      scope.$digest();
      expect(scope.statusTooltipText()).toMatch(/new/i);
    });
  });

  describe('status class', function() {
    it('is disabled', function() {
      scope.published = true;
      scope.field.disabled = true;
      scope.$digest();
      expect(scope.statusClass()).toBe('disabled');
    });

    it('is published', function() {
      scope.published = true;
      scope.field.disabled = false;
      scope.$digest();
      expect(scope.statusClass()).toBe('published');
    });

    it('is unpublished', function() {
      scope.published = false;
      scope.$digest();
      expect(scope.statusClass()).toBe('unpublished');
    });
  });

  describe('display field enabled', function() {
    it('if field type is symbol', function() {
      scope.field.type = 'Symbol';
      scope.$digest();
      expect(scope.displayEnabled()).toBeTruthy();
    });

    it('if field type is text', function() {
      scope.field.type = 'Text';
      scope.$digest();
      expect(scope.displayEnabled()).toBeTruthy();
    });

    it('if field type is something else', function() {
      scope.field.type = 'Array';
      scope.$digest();
      expect(scope.displayEnabled()).toBeFalsy();
    });
  });

  describe('check if field is display field', function() {
    beforeEach(function() {
      scope.contentType = {data: {}};
    });

    it('true', function() {
      scope.field.id = 'fieldid';
      scope.contentType.data.displayField = 'fieldid';
      scope.$digest();
      expect(scope.isDisplayField()).toBeTruthy();
    });

    it('false', function() {
      scope.field.id = 'fieldid';
      scope.contentType.data.displayField = 'something else';
      scope.$digest();
      expect(scope.isDisplayField()).toBeFalsy();
    });
  });

  describe('displayed field name', function() {
    it('is empty', function() {
      scope.field.name = '';
      scope.$digest();
      expect(scope.displayedFieldName()).toMatch(/untitled/i);
    });

    it('is empty but has id', function() {
      scope.field.name = '';
      scope.field.id = '123';
      scope.$digest();
      expect(scope.displayedFieldName()).toMatch(/id/i);
    });

    it('is not empty', function() {
      scope.field.name = 'fieldname';
      scope.$digest();
      expect(scope.displayedFieldName()).toBe('fieldname');
    });
  });

  it('opens validations', function() {
    scope.openValidations();
    expect(stubs.open).toBeCalled();
  });

  describe('update field id', function() {
    beforeEach(function() {
      scope.field.name = 'fieldname';
      scope.isDisplayField = sinon.stub();
    });

    it('if published, stores the old field name', function() {
      scope.published = true;
      scope.$digest();
      scope.updateFieldId();
      expect(scope.isDisplayField).not.toBeCalled();
    });

    it('if not published, but id different from old name, stores the old field name', function() {
      scope.published = false;
      scope.field.id = 'fieldid';
      stubs.toIdentifier.returns('fieldname');
      scope.$digest();
      scope.updateFieldId();
      expect(scope.isDisplayField).not.toBeCalled();
    });

    describe('if not published, and id same as old name', function() {
      beforeEach(function() {
        scope.published = false;
        scope.field.id = 'fieldname';
        stubs.toIdentifier.returns('fieldname');
        scope.setDisplayField = sinon.stub();
      });

      it('checks if its display field', function() {
        scope.$digest();
        scope.updateFieldId();
        expect(scope.isDisplayField).toBeCalled();
      });

      it('stores field id', function() {
        scope.$digest();
        scope.updateFieldId();
        expect(scope.field.id).toEqual('fieldname');
      });

      it('if no otdoc gets no otdoc value', function() {
        scope.$digest();
        scope.updateFieldId();
        expect(stubs.at).not.toBeCalled();
      });

      describe('with an otDoc', function() {
        beforeEach(function() {
          scope.otDoc = {
            at: stubs.at
          };
          stubs.at.returns({
            set: stubs.set,
            get: stubs.get
          });
        });

        describe('sets value on otdoc successfully', function() {
          beforeEach(function() {
            stubs.set.callsArgWith(1, null);
          });

          describe('if already display field', function() {
            beforeEach(function() {
              scope.isDisplayField.returns(true);
              scope.$digest();
              scope.updateFieldId();
            });

            it('gets otdoc value for id', function() {
              expect(stubs.at).toBeCalled();
            });

            it('id is set on subdoc', function() {
              expect(stubs.set).toBeCalledWith('fieldname');
            });

            it('sets display field', function() {
              expect(scope.setDisplayField).toBeCalledWith(scope.field);
            });
          });

          describe('if not already display field', function() {
            beforeEach(function() {
              scope.isDisplayField.returns(false);
              scope.displayEnabled = sinon.stub();
              scope.displayEnabled.returns(true);
              scope.contentType = {
                data: {
                  displayField: ''
                }
              };
              scope.$digest();
              scope.updateFieldId();
            });

            it('gets otdoc value for id', function() {
              expect(stubs.at).toBeCalled();
            });

            it('id is set on subdoc', function() {
              expect(stubs.set).toBeCalledWith('fieldname');
            });

            it('sets display field', function() {
              expect(scope.setDisplayField).toBeCalledWith(scope.field);
            });
          });
        });

        describe('fails to set value on otdoc', function() {
          beforeEach(function() {
            stubs.set.callsArgWith(1, {});
            stubs.get.returns('newid');
            scope.$digest();
            scope.updateFieldId();
          });

          it('gets otdoc value for id', function() {
            expect(stubs.at).toBeCalled();
          });

          it('id is set on subdoc', function() {
            expect(stubs.set).toBeCalledWith('fieldname');
          });

          it('gets id from subdoc', function() {
            expect(stubs.get).toBeCalled();
          });

          it('sets new id on field', function() {
            expect(scope.field.id).toEqual('newid');
          });

          it('shows error', function() {
            expect(stubs.serverError).toBeCalled();
          });
        });
      });

    });

  });

  describe('change field type', function() {
    it('does nothing with no otDoc', function() {
      expect(stubs.at).not.toBeCalled();
    });

    describe('with an otDoc', function() {
      beforeEach(function() {
        scope.otDoc = {
          at: stubs.at
        };
        stubs.at.returns({
          set: stubs.set
        });

        scope.index = 2;
        scope.field = {
          name: 'fieldname',
          id: 'fieldid',
          uiid: 'fielduiid'
        };

        scope.otUpdateEntity = sinon.stub();
      });

      describe('update suceeds', function() {
        beforeEach(function() {
          stubs.set.callsArgWith(1, null);
          scope.changeFieldType({});
        });

        it('gets otdoc', function() {
          expect(stubs.at).toBeCalled();
        });

        it('at called with field path', function() {
          expect(stubs.at).toBeCalledWith(['fields', 2]);
        });

        it('sets new field on otdoc', function() {
          expect(stubs.set).toBeCalledWith(scope.field);
        });

        it('updates ot entity', function() {
          expect(scope.otUpdateEntity).toBeCalled();
        });
      });

      describe('update fails', function() {
        beforeEach(function() {
          stubs.set.callsArgWith(1, {});
          scope.changeFieldType({});
        });

        it('does not update ot entity', function() {
          expect(scope.otUpdateEntity).not.toBeCalled();
        });

        it('shows error', function() {
          expect(stubs.serverError).toBeCalled();
        });
      });
    });
  });

  describe('toggling properties', function() {
    it('does nothing with no otDoc', function() {
      expect(stubs.at).not.toBeCalled();
    });

    describe('with an otDoc', function() {
      beforeEach(function() {
        scope.otDoc = {
          at: stubs.at
        };
        scope.index = 2;
        stubs.at.returns({
          set: stubs.set,
          get: stubs.get
        });
        stubs.get.returns(true);

        scope.otUpdateEntity = sinon.stub();
      });

      describe('update suceeds', function() {
        beforeEach(function() {
          stubs.set.callsArgWith(1, null);
          scope.toggle('propname');
        });

        it('gets otdoc', function() {
          expect(stubs.at).toBeCalled();
        });

        it('at called with field path', function() {
          expect(stubs.at).toBeCalledWith(['fields', 2, 'propname']);
        });

        it('gets current property value for toggling', function() {
          expect(stubs.get).toBeCalled();
        });

        it('sets new property on otdoc', function() {
          expect(stubs.set).toBeCalledWith(false);
        });

        it('updates ot entity', function() {
          expect(scope.otUpdateEntity).toBeCalled();
        });

        it('fires analytics event', function() {
          expect(stubs.modifiedContentType).toBeCalled();
        });
      });

      describe('update fails', function() {
        beforeEach(function() {
          stubs.set.callsArgWith(1, {});
          scope.toggle('propname');
        });

        it('does not update ot entity', function() {
          expect(scope.otUpdateEntity).not.toBeCalled();
        });

        it('shows error', function() {
          expect(stubs.serverError).toBeCalled();
        });
      });
    });

  });

  describe('deletes field setting', function() {
    it('does nothing with no otDoc', function() {
      expect(stubs.at).not.toBeCalled();
    });

    describe('with an otDoc', function() {
      beforeEach(function() {
        scope.otDoc = {
          at: stubs.at
        };
        stubs.at.returns({
          remove: stubs.remove
        });

        scope.index = 2;
        scope.field = {
          field: true
        };

        scope.otUpdateEntity = sinon.stub();
      });

      describe('update suceeds', function() {
        var field;
        beforeEach(function(done) {
          stubs.remove.callsArgWith(0, null);
          scope.$on('fieldDeleted', function (event, deletedField) {
            field = deletedField;
            done();
          });
          scope['delete']();
        });

        it('gets otdoc', function() {
          expect(stubs.at).toBeCalled();
        });

        it('at called with field path', function() {
          expect(stubs.at).toBeCalledWith(['fields', 2]);
        });

        it('deletes property on otdoc', function() {
          expect(stubs.remove).toBeCalled();
        });

        it('updates ot entity', function() {
          expect(scope.otUpdateEntity).toBeCalled();
        });

        it('fires analytics event', function() {
          expect(stubs.modifiedContentType).toBeCalled();
        });

        it('emits fieldDeleted event', function() {
          expect(field).toBe(scope.field);
        });
      });

      describe('update fails', function() {
        beforeEach(function() {
          stubs.remove.callsArgWith(0, {});
          scope['delete']();
        });

        it('does not update ot entity', function() {
          expect(scope.otUpdateEntity).not.toBeCalled();
        });
      });
    });

  });


});
