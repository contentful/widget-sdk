'use strict';

describe('entityEditor/StatusNotificationsController', function () {
  var entityLabel = 'entityLabel';

  beforeEach(function () {
    module('contentful/test');
    var $rootScope = this.$inject('$rootScope');
    this.scope = _.extend($rootScope.$new(), {
      otDoc: {state: {}},
      permissionController: {
        can: sinon.stub().returns({can: true})
      },
    });
    this.scope[entityLabel] = {
      isArchived: sinon.stub()
    };

    var $controller = this.$inject('$controller');
    this.controller = $controller('entityEditor/StatusNotificationsController', {
      $scope: this.scope,
      entityLabel: entityLabel
    });
  });

  it('sets falsy status and message by default', function () {
    this.$apply();
    expect(this.controller.status).toBeFalsy();
    expect(this.controller.message).toBeFalsy();
  });

  it('sets "ot-connection-error" status when otDoc has error', function () {
    this.scope.otDoc.state.error = true;
    this.$apply();
    expect(this.controller.status).toEqual('ot-connection-error');
    expect(this.controller.message).toBeTruthy();
  });

  it('sets "editing-not-allowed" when no permission', function () {
    this.scope.permissionController.can.returns({can: false});
    this.$apply();
    expect(this.controller.status).toEqual('editing-not-allowed');
    expect(this.controller.message).toBeTruthy();
  });

  it('sets "archived" when entity is archived', function () {
    this.scope[entityLabel].isArchived.returns(true);
    this.$apply();
    expect(this.controller.status).toEqual('archived');
    expect(this.controller.message).toBeTruthy();
  });
});
