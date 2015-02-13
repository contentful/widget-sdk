'use strict';

describe('ContentTypeEditor Controller', function () {
  var scope, controller, $q, logger, notification;
  var space, contentType;
  var modifiedContentTypeStub;
  beforeEach(function () {
    modifiedContentTypeStub = sinon.stub();
    module('contentful/test', function ($provide) {
      $provide.value('analytics', {
        modifiedContentType: modifiedContentTypeStub
      });

      $provide.removeControllers('PermissionController');
    });

    inject(function ($rootScope, $controller, cfStub, $injector){
      scope = $rootScope.$new();
      space = cfStub.space('space');
      contentType = cfStub.contentType(space, 'contentType', 'Content Type');
      $q = $injector.get('$q');
      logger = $injector.get('logger');
      notification = $injector.get('notification');

      scope.tab = {
        params: {
          contentType: contentType
        }
      };

      scope.user = {
        features: {}
      };

      scope.permissionController = { can: sinon.stub() };
      scope.permissionController.can.returns({can: true});

      controller = $controller('ContentTypeEditorController', {$scope: scope});
      scope.$digest();
    });
  });

  it('sets contentType on the scope', function () {
    expect(scope.contentType).toEqual(contentType);
  });

  it('enables ot', function () {
    scope.permissionController.can.returns({can: true});
    scope.$digest();
    expect(scope.otDisabled).toBeFalsy();
  });

  it('disables ot', function () {
    scope.permissionController.can.returns({can: false});
    scope.$digest();
    expect(scope.otDisabled).toBeTruthy();
  });

  describe('load published content type', function () {
    var publishedCT;
    beforeEach(inject(function (cfStub){
      var newContentType = cfStub.contentType(space, 'contentType2', 'Content Type 2');
      publishedCT = {published:true};
      newContentType.getPublishedStatus = sinon.stub().returns($q.when(publishedCT));
      scope.contentType = newContentType;
      scope.$apply();
    }));

    it('gets published status', function () {
      expect(scope.contentType.getPublishedStatus).toBeCalled();
    });

    it('sets the published content type', function () {
      expect(scope.publishedContentType).toEqual(publishedCT);
    });
  });

  describe('on OT remote op', function () {
    var updateEntityStub;
    beforeEach(inject(function ($rootScope){
      updateEntityStub = sinon.stub();
      scope.otUpdateEntity = updateEntityStub;
      $rootScope.$broadcast('otRemoteOp');
    }));

    it('fires entity update', function () {
      expect(updateEntityStub).toBeCalled();
    });
  });

  it('dirty tab marker is not set with no otDoc', function () {
    expect(scope.tab.dirty).toBeUndefined();
  });

  describe('dirty tab marker', function () {
    var versionStub;
    beforeEach(function () {
      versionStub = sinon.stub();
      scope.contentType.getPublishedVersion = versionStub;
      scope.otDoc = {
        version: 3
      };
    });

    it('is set', function () {
      versionStub.returns(1);
      scope.$digest();
      expect(scope.tab.dirty).toBe(true);
    });

    it('is unset', function () {
      versionStub.returns(4);
      scope.$digest();
      expect(scope.tab.dirty).toBe(false);
    });
  });

  it('canPublish is defined', function () {
    expect(scope.canPublish).toBeDefined();
  });

  it('cannot publish with no otDoc', function () {
    expect(scope.canPublish()).toBeFalsy();
  });

  describe('canPublish', function () {
    var getAtStub, canPublishStub;
    beforeEach(function () {
      getAtStub = sinon.stub();
      canPublishStub = sinon.stub();
      scope.otDoc = {
        version: 1,
        getAt: getAtStub
      };
      scope.contentType.canPublish = sinon.stub();
    });

    it('is false if no published version', function () {
      getAtStub.withArgs(['sys', 'publishedVersion']).returns(undefined);
      getAtStub.withArgs(['fields']).returns({length: 2});
      canPublishStub.returns(true);
      scope.permissionController.can.returns({can: true});
      expect(scope.canPublish()).toBeFalsy();
    });

    it('is false if version changed since published', function () {
      scope.otDoc.version = 2;
      getAtStub.withArgs(['sys', 'publishedVersion']).returns(1);
      getAtStub.withArgs(['fields']).returns({length: 2});
      canPublishStub.returns(true);
      scope.permissionController.can.returns({can: true});
      expect(scope.canPublish()).toBeFalsy();
    });

    it('is false if it has no fields', function () {
      getAtStub.withArgs(['sys', 'publishedVersion']).returns(1);
      getAtStub.withArgs(['fields']).returns({length: 0});
      canPublishStub.returns(true);
      scope.permissionController.can.returns({can: true});
      expect(scope.canPublish()).toBeFalsy();
    });

    it('is false if entity cannot be published', function () {
      getAtStub.withArgs(['sys', 'publishedVersion']).returns(1);
      getAtStub.withArgs(['fields']).returns({length: 2});
      canPublishStub.returns(false);
      scope.permissionController.can.returns({can: true});
      expect(scope.canPublish()).toBeFalsy();
    });

    it('is false if user has no permission to publish', function () {
      getAtStub.withArgs(['sys', 'publishedVersion']).returns(1);
      getAtStub.withArgs(['fields']).returns({length: 2});
      canPublishStub.returns(true);
      scope.permissionController.can.returns({can: false});
      expect(scope.canPublish()).toBeFalsy();
    });

    it('is true if all conditions allow', function () {
      getAtStub.withArgs(['sys', 'publishedVersion']).returns(1);
      getAtStub.withArgs(['fields']).returns({length: 2});
      canPublishStub.returns(true);
      scope.permissionController.can.returns({can: true});
      expect(scope.canPublish()).toBeFalsy();
    });
  });

  describe('fires an initial validation just once', function () {
    var validateStub;
    beforeEach(inject(function ($rootScope){
      validateStub = sinon.stub();
      scope.validate = validateStub;
      scope.contentType.data = {fields: [1]};
      $rootScope.$broadcast('otBecameEditable');
      $rootScope.$broadcast('otBecameEditable');
    }));

    it('fires validate', function () {
      expect(validateStub).toBeCalledOnce();
    });
  });

  it('updates published content type', function () {
    var publishedCT = {published: true};
    scope.updatePublishedContentType(publishedCT);
    expect(scope.publishedContentType).toEqual(publishedCT);
  });

  it('has no fields', function () {
    expect(scope.hasFields).toBeFalsy();
  });

  it('has fields', function () {
    scope.contentType.data = {fields: [1]};
    scope.$digest();
    expect(scope.hasFields).toBeTruthy();
  });

  describe('sets arrays with published content type info', function () {
    beforeEach(function () {
      scope.publishedContentType = {
        data: {
          fields: [
            {apiName: 'a1', id: 'i1'},
            {apiName: 'a2', id: 'i2'},
            {apiName: 'a3', id: 'i3'}
          ]
        },
      };
      scope.$digest();
    });

    it('for field apiNames', function () {
      expect(scope.publishedApiNames).toEqual(['a1', 'a2', 'a3']);
    });

    it('for field IDs', function () {
      expect(scope.publishedIds).toEqual(['i1', 'i2', 'i3']);
    });
  });

  it('sets tab title from content type', function () {
    expect(scope.tab.title).toBe('Content Type');
  });

  describe('sets a field on a content type', function () {
    var childScope, pushStub, eventArg;
    beforeEach(function () {
      childScope = scope.$new();
      childScope.$on('fieldAdded', function (event, arg) {
        eventArg = arg;
      });
      scope.otUpdateEntity = sinon.stub();
      scope.otDoc = {
        at: sinon.stub()
      };
      pushStub = sinon.stub();
      scope.otDoc.at.returns({
        push: pushStub
      });
    });

    describe('succeeds', function () {
      beforeEach(function () {
        pushStub.callsArgWith(1, null, [{p: [0,1]}]);
        scope.addField({});
      });

      it('push is called', function () {
        expect(pushStub).toBeCalled();
      });

      it('updates ot entity', function () {
        expect(scope.otUpdateEntity).toBeCalled();
      });

      it('broadcasts event', function () {
        expect(eventArg).toEqual(1);
      });

      it('fires analytics event', function () {
        expect(modifiedContentTypeStub).toBeCalled();
      });
    });

    describe('fails', function () {
      beforeEach(function () {
        pushStub.callsArgWith(1, {});
        scope.addField({});
      });

      it('push is called', function () {
        expect(pushStub).toBeCalled();
      });

      it('fires server error notification', function () {
        expect(logger.logSharejsWarn).toBeCalled();
        expect(notification.error).toBeCalled();
      });
    });

  });

});
