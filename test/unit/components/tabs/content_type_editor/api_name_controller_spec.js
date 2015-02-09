'use strict';

describe('ApiNameController', function () {
  var controller, scope, stubs, logger, notification;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs(['toIdentifier', 'at', 'set', 'get', 'isDisplayableAsTitleFilter']);
      $provide.value('isDisplayableAsTitleFilter', stubs.isDisplayableAsTitleFilter);
      $provide.constant('stringUtils', {toIdentifier: stubs.toIdentifier});
    });
    inject(function ($controller, $rootScope, $injector) {
      logger = $injector.get('logger');
      notification = $injector.get('notification');
      scope = $rootScope.$new();

      scope.field = {};

      controller = $controller('ApiNameController', {$scope: scope});
      scope.$digest();
    });
  });

  describe('update apiName', function() {
    beforeEach(function() {
      scope.field.name = 'fieldname';
      scope.isDisplayField = sinon.stub();
    });

    it('if published, stores the old field name', function() {
      scope.published = true;
      scope.$digest();
      controller.updateFromName();
      expect(scope.isDisplayField).not.toBeCalled();
    });

    it('if not published, but id different from old name, stores the old field name', function() {
      scope.published = false;
      scope.field.id = 'fieldid';
      stubs.toIdentifier.returns('fieldname');
      scope.$digest();
      controller.updateFromName();
      expect(scope.isDisplayField).not.toBeCalled();
    });

    describe('if not published, and id same as old name', function() {
      beforeEach(function() {
        scope.published = false;
        scope.field.id = 'fieldId';
        scope.field.apiName = 'fieldname';
        stubs.toIdentifier.returns('fieldname');
        scope.setDisplayField = sinon.stub();
      });

      it('checks if its display field', function() {
        scope.$digest();
        controller.updateFromName();
        expect(scope.isDisplayField).toBeCalled();
      });

      it('stores field apiName', function() {
        scope.$digest();
        controller.updateFromName();
        expect(scope.field.apiName).toEqual('fieldname');
      });

      it('if no otdoc gets no otdoc value', function() {
        scope.$digest();
        controller.updateFromName();
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
              controller.updateFromName();
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
              stubs.isDisplayableAsTitleFilter.returns(true);
              scope.contentType = {
                data: {
                  displayField: ''
                }
              };
              scope.$digest();
              controller.updateFromName();
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
            stubs.get.returns('newApiName');
            scope.$digest();
            controller.updateFromName();
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
            expect(scope.field.apiName).toEqual('newApiName');
          });

          it('shows error', function() {
            expect(notification.error).toBeCalled();
            expect(logger.logSharejsWarn).toBeCalled();
          });
        });
      });

    });

  });

});

