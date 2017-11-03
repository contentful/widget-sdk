import sinon from 'npm:sinon';

describe('app/ContentModel/Editor/Actions', function () {
  let controller, scope, $q, logger, notification, accessChecker, ReloadNotification, spaceContext;
  let space, contentType;

  function FormStub () {
    this.$setDirty = function () {
      this._setDirty(true);
    };

    this.$setPristine = function () {
      this._setDirty(false);
    };

    this._setDirty = function (dirty) {
      this.$dirty = dirty;
      this.$pristine = !dirty;
    };

    this.$setPristine();
  }

  beforeEach(function () {
    const self = this;
    module('contentful/test', function ($provide) {
      $provide.value('navigation/closeState', self.closeSpy = sinon.spy());
      $provide.stubLaunchDarkly();
    });

    this.$state = this.$inject('$state');
    this.$state.go = sinon.stub().resolves();

    $q = this.$inject('$q');
    logger = this.$inject('logger');
    notification = this.mockService('notification');
    accessChecker = this.$inject('accessChecker');
    accessChecker.canPerformActionOnEntryOfType = sinon.stub().returns(true);
    ReloadNotification = this.$inject('ReloadNotification');
    ReloadNotification.basicErrorHandler = sinon.spy();

    this.cfStub = this.$inject('cfStub');

    space = this.cfStub.space('spaceid');
    spaceContext = this.$inject('spaceContext');
    spaceContext.resetWithSpace(space);
    spaceContext.uiConfig = {addOrEditCt: () => {}};
    contentType = this.cfStub.contentType(space, 'typeid', 'typename');

    scope = this.$inject('$rootScope').$new();
    scope.context = {};
    scope.contentType = contentType;
    scope.broadcastFromSpace = sinon.stub();

    controller = this.$inject('app/ContentModel/Editor/Actions').default(scope);
  });

  describe('#delete command', function () {
    beforeEach(function () {
      contentType.delete = sinon.stub().resolves();
      contentType.unpublish = sinon.stub().resolves(contentType);
      contentType.isPublished = sinon.stub().returns(true);

      space.getEntries = sinon.stub().resolves([]);

      this.modalDialog = this.$inject('modalDialog');
      sinon.stub(this.modalDialog, 'open').callsFake((params) => {
        if (params.controller) {
          const $scope = this.$inject('$rootScope').$new();
          params.controller($scope);
          $scope.delete.execute();
        }
      });
    });

    describe('without entries', function () {
      it('calls unpublish and then delete', function () {
        controller.delete.execute();
        this.$apply();
        sinon.assert.callOrder(contentType.unpublish, contentType.delete);
      });

      it('asks the user for confirmation', function () {
        controller.delete.execute();
        this.$apply();
        sinon.assert.called(this.modalDialog.open);
      });

      it('does not send DELETE if the user denies confirmation', function () {
        this.modalDialog.open.restore();
        sinon.stub(this.modalDialog, 'open').resolves();

        controller.delete.execute();
        this.$apply();
        sinon.assert.notCalled(contentType.delete);
      });

      it('notifies of server errors', function () {
        contentType.delete.rejects({error: true});
        controller.delete.execute();
        this.$apply();
        sinon.assert.called(notification.error);
        sinon.assert.called(logger.logServerWarn);
      });

      it('shows notification', function () {
        controller.delete.execute();
        this.$apply();
        sinon.assert.called(notification.info);
      });

      it('closes state', function () {
        controller.delete.execute();
        this.$apply();
        sinon.assert.calledOnce(this.closeSpy);
      });
    });

    describe('delete flow interruptions', function () {
      function testForbiddenRemoval (dialog, data) {
        const matchObj = {
          template: 'content_type_removal_forbidden_dialog',
          scopeData: data || {}
        };

        controller.delete.execute();
        scope.$apply();
        sinon.assert.calledWith(dialog.open, sinon.match(matchObj));
        sinon.assert.notCalled(contentType.delete);
      }

      function testEndpointError () {
        controller.delete.execute();
        scope.$apply();
        sinon.assert.calledOnce(ReloadNotification.basicErrorHandler);
      }

      it('notifies the user when entries endpoint cannot be read', function () {
        accessChecker.canPerformActionOnEntryOfType.returns(false);
        space.getEntries.rejects({statusCode: 404});
        testForbiddenRemoval(this.modalDialog, {count: ''});
      });

      it('notifies the user when entries cannot be read due to policy', function () {
        accessChecker.canPerformActionOnEntryOfType.returns(false);
        space.getEntries.resolves([]);
        testForbiddenRemoval(this.modalDialog, {count: ''});
      });

      it('notifies the user when there are entries', function () {
        space.getEntries.resolves([{data: {sys: {id: 'entry'}}}]);
        testForbiddenRemoval(this.modalDialog, {count: 1});
      });

      it('fails for 404 when entries can be read by policy', function () {
        accessChecker.canPerformActionOnEntryOfType.returns(true);
        space.getEntries.rejects({statusCode: 404});
        testEndpointError();
      });

      it('fails for non-404 status codes', function () {
        accessChecker.canPerformActionOnEntryOfType.returns(true);
        space.getEntries.rejects({statusCode: 500});
        testEndpointError();
      });
    });

    describe('when CT is not published', function () {
      beforeEach(function () {
        contentType.isPublished = sinon.stub().returns(false);
      });

      it('does not count entries', function () {
        controller.delete.execute();
        this.$apply();
        sinon.assert.notCalled(space.getEntries);
      });

      it('does not call unpublish', function () {
        controller.delete.execute();
        this.$apply();
        sinon.assert.notCalled(contentType.unpublish);
      });

      it('calls delete', function () {
        controller.delete.execute();
        this.$apply();
        sinon.assert.called(contentType.delete);
      });
    });
  });

  it('when cancelling navigates back to list', function () {
    controller.cancel.execute();
    sinon.assert.calledWith(this.$state.go, 'spaces.detail.content_types.list');
  });

  describe('#save command', function () {
    beforeEach(function () {
      spaceContext.editingInterfaces.save = sinon.stub().resolves();
      spaceContext.editingInterfaces.get = sinon.stub().resolves({
        sys: { version: 1 },
        controls: []
      });

      scope.contentTypeForm = new FormStub();
      scope.contentTypeForm.$setDirty();

      scope.validate = sinon.stub().returns(true);

      scope.editingInterface = { sys: {} };

      scope.contentType.save = sinon.stub().returns(this.when(scope.contentType));
      scope.contentType.publish = sinon.stub().returns(this.when(scope.contentType));
    });

    pit('resets form and state context to pristine state', function () {
      scope.context.dirty = true;
      return controller.save.execute()
      .then(function () {
        expect(scope.context.dirty).toBe(false);
        expect(scope.contentTypeForm.$pristine).toBe(true);
      });
    });

    pit('saves and publishes content type', function () {
      return controller.save.execute()
      .then(function () {
        const ct = scope.contentType;
        sinon.assert.calledOnce(ct.save);
        sinon.assert.calledOnce(ct.publish);
      });
    });

    pit('saves editing interface', function () {
      spaceContext.editingInterfaces.get = sinon.stub().resolves({
        sys: { version: 10 },
        controls: []
      });


      return controller.save.execute()
      .then(function () {
        sinon.assert.calledOnce(spaceContext.editingInterfaces.save);

        const callArgs = spaceContext.editingInterfaces.save.getCall(0).args;

        // First argument is the content type
        expect(callArgs[0]).toEqual({
          name: 'typename',
          fields: [],
          sys: {
            id: 'typeid',
            type: 'ContentType',
            version: 1
          },
          displayField: undefined
        });

        // Second argument is the editor interface
        expect(callArgs[1]).toEqual({
          sys: { version: 10 }
        });
      });
    });

    it('updates editing interface on scope', function () {
      spaceContext.editingInterfaces.save.resolves('NEW EI');
      controller.save.execute();
      this.$apply();
      expect(scope.editingInterface).toBe('NEW EI');
    });

    describe('with invalid data', function () {
      beforeEach(function () {
        scope.validate.returns(false);
        scope.validationResult = {errors: []};
      });

      pit('does not save entities', function () {
        return controller.save.execute()
        .catch(function () {
          sinon.assert.notCalled(spaceContext.editingInterfaces.save);
          sinon.assert.notCalled(scope.contentType.save);
        });
      });

      pit('shows error message', function () {
        return controller.save.execute()
        .catch(function () {
          sinon.assert.called(notification.error);
        });
      });
    });

    describe('content type server error', function () {
      beforeEach(function () {
        scope.contentType.save.returns(this.reject('err'));
      });

      pit('rejects promise', function () {
        return controller.save.execute()
        .catch(function (err) {
          expect(err).toBe('err');
        });
      });

      pit('does not publish content type', function () {
        return controller.save.execute()
        .catch(function () {
          sinon.assert.notCalled(scope.contentType.publish);
        });
      });

      pit('shows error message', function () {
        return controller.save.execute()
        .catch(function () {
          sinon.assert.called(notification.error);
        });
      });

      pit('does not reset form', function () {
        return controller.save.execute()
        .catch(function () {
          expect(scope.contentTypeForm.$pristine).toBe(false);
        });
      });
    });

    it('redirects if the content type is new', function* () {
      scope.context.isNew = true;
      yield controller.save.execute();
      sinon.assert.calledWith(
        this.$state.go,
        'spaces.detail.content_types.detail.fields',
        sinon.match({contentTypeId: 'typeid'})
      );
    });
  });

  describe('#save command disabled', function () {
    beforeEach(function () {
      scope.contentTypeForm = {
        $dirty: true
      };
      scope.contentType.data.fields = [
        { disabled: false },
        { disabled: true }
      ];
      scope.contentType.data.sys.publishedVersion = 1;
    });

    it('is true when form is pristine', function () {
      expect(controller.save.isDisabled()).toBe(false);
      scope.contentTypeForm.$dirty = false;
      expect(controller.save.isDisabled()).toBe(true);
    });

    it('is false when form is pristine and Content Type unpublished', function () {
      expect(controller.save.isDisabled()).toBe(false);
      scope.contentTypeForm.$dirty = false;
      delete scope.contentType.data.sys.publishedVersion;
      expect(controller.save.isDisabled()).toBe(false);
    });

    it('is true when content type has no fields', function () {
      expect(controller.save.isDisabled()).toBe(false);
      scope.contentType.data.fields = [];
      expect(controller.save.isDisabled()).toBe(true);
      scope.contentType.data.fields = null;
      expect(controller.save.isDisabled()).toBe(true);
    });

    it('is false when all fields are disabled', function () {
      expect(controller.save.isDisabled()).toBe(false);
      scope.contentType.data.fields[0].disabled = true;
      expect(controller.save.isDisabled()).toBe(true);
    });
  });

  describe('#duplicate command', function () {
    function getCreatedCt () {
      return spaceContext.space.newContentType.returnValues[0];
    }

    beforeEach(function () {
      sinon.stub(this.$inject('modalDialog'), 'open').callsFake((params) => {
        if (params.scope && params.scope.duplicate) {
          _.extend(params.scope.contentTypeMetadata, {name: 'test', id: 'test'});
          const confirm = sinon.spy();
          params.scope.dialog = {confirm: confirm, cancel: sinon.spy(), formController: {$valid: true}};
          params.scope.duplicate.execute();
          scope.$apply();
          return {promise: $q.resolve(confirm.firstCall.args[0])};
        }

        if (params.title === 'Duplicated content type') {
          return {promise: $q.resolve()};
        }
      });

      sinon.stub(spaceContext.space, 'newContentType').callsFake((data) => {
        const ct = this.cfStub.contentType(space, 'ct-id', 'ct-name');
        _.extend(ct.data, data);
        ct.save = sinon.stub().resolves(ct);
        ct.publish = sinon.stub().resolves(ct);
        return ct;
      });

      scope.editingInterface = {sys: {}, controls: []};
      spaceContext.editingInterfaces.save = sinon.stub().resolves();

      sinon.stub(spaceContext.editingInterfaces, 'get').callsFake((ctData) => {
        return $q.resolve({
          sys: { version: 1 },
          controls: _.map(ctData.fields, function (field) {
            return { field: field, widgetId: 'some-widget' };
          })
        });
      });
    });

    pit('creates new content types type with a provided name', function () {
      return controller.duplicate.execute().then(function () {
        sinon.assert.calledOnce(spaceContext.space.newContentType);
        expect(spaceContext.space.newContentType.firstCall.args[0].name).toBe('test');
      });
    });

    pit('saves a duplicate with the same field IDs and display field', function () {
      contentType.data.displayField = 'field-id-2-disp';
      contentType.data.fields = [{id: 'field-id-1'}, {id: 'field-id-2-disp'}];

      return controller.duplicate.execute().then(function () {
        const ct = getCreatedCt();
        sinon.assert.calledOnce(ct.save);
        expect(typeof ct.data.displayField).toBe('string');
        expect(ct.data.displayField).toBe(contentType.data.displayField);
        expect(ct.data.displayField).toBe(ct.data.fields[1].id);
        expect(ct.data.fields[0].id).toBe(contentType.data.fields[0].id);
        expect(ct.data.fields[1].id).toBe(contentType.data.fields[1].id);
      });
    });

    pit('publishes content type duplicate', function () {
      return controller.duplicate.execute().then(function () {
        sinon.assert.calledOnce(getCreatedCt().publish);
      });
    });

    pit('synchronizes controls in the new EI', function () {
      contentType.data.fields = [{id: 'xyz'}, {id: 'boom'}];
      scope.editingInterface.controls = [
        {widgetId: 'margarita-making-widget'},
        {widgetId: 'some-other-widget'}
      ];

      return controller.duplicate.execute().then(function () {
        sinon.assert.calledOnce(spaceContext.editingInterfaces.save);
        const ei = spaceContext.editingInterfaces.save.firstCall.args[1];
        expect(ei.controls[0].widgetId).toBe('margarita-making-widget');
        expect(ei.controls[1].widgetId).toBe('some-other-widget');
      });
    });
  });

  describe('#duplicate command disabled', function () {
    beforeEach(function () {
      scope.context.isNew = false;
      scope.contentTypeForm = {$dirty: false};
      scope.contentType.data.sys.publishedVersion = 100;
      scope.contentType.isPublished = _.constant(true);
      accessChecker.shouldDisable = _.constant(false);
      expect(controller.duplicate.isDisabled()).toBe(false);
    });

    it('is true when content type is new', function () {
      scope.context.isNew = true;
      expect(controller.duplicate.isDisabled()).toBe(true);
    });

    it('is true when from is dirty', function () {
      scope.contentTypeForm.$dirty = true;
      expect(controller.duplicate.isDisabled()).toBe(true);
      scope.contentTypeForm.$dirty = false;
      delete scope.contentType.data.sys.publishedVersion;
      expect(controller.duplicate.isDisabled()).toBe(true);
    });

    it('is true when update/create are denied', function () {
      accessChecker.shouldDisable = _.constant(true);
      expect(controller.duplicate.isDisabled()).toBe(true);
    });

    it('is true when content type is not published', function () {
      scope.contentType.isPublished = _.constant(false);
      expect(controller.duplicate.isDisabled()).toBe(true);
    });
  });
});
