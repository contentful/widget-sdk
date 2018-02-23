import * as sinon from 'helpers/sinon';

describe('DeleteSpace', function () {
  beforeEach(function () {
    this.space = {sys: {id: 'SPACE_ID'}, name: 'Space name'};
    this.onSuccess = sinon.stub();
    this.modalDialog = {open: sinon.stub(), richtextLayout: () => 'TEMPLATE'};
    this.createEndpoint = sinon.stub();
    this.TokenStore = {refresh: sinon.stub()};
    this.notification = {info: sinon.stub()};
    this.ReloadNotification = {basicErrorHandler: sinon.stub()};

    module('contentful/test', ($provide) => {
      $provide.value('modalDialog', this.modalDialog);
      $provide.value('data/EndpointFactory', {createSpaceEndpoint: this.createEndpoint});
      $provide.value('services/TokenStore', this.TokenStore);
      $provide.value('notification', this.notification);
      $provide.value('ReloadNotification', this.ReloadNotification);
    });

    this.modalDialog.open.returns({promise: this.resolve()});
    this.endpoint = sinon.stub().resolves();
    this.createEndpoint.returns(this.endpoint);
    this.openDeleteSpaceDialog = this.$inject('services/DeleteSpace').openDeleteSpaceDialog;

    this.openDeleteSpaceDialog({space: this.space, onSuccess: this.onSuccess});
    this.dialogScope = this.modalDialog.open.firstCall.args[0].scope;

    this.setSpaceNameInput = (value) => {
      this.dialogScope.input.spaceName = value;
      this.dialogScope.$digest();
    };
  });

  it('opens dialog and sets space data on scope', function () {
    sinon.assert.calledOnce(this.modalDialog.open.withArgs(sinon.match({
      template: 'TEMPLATE',
      noNewScope: true,
      scope: sinon.match.object
    })));
    expect(this.dialogScope.spaceName).toBe('Space name');
    expect(this.dialogScope.input).toBeDefined();
  });

  it('enables deleting only when input matches space name', function () {
    this.setSpaceNameInput('Not space name');
    expect(this.dialogScope.remove.isDisabled()).toBe(true);
    this.setSpaceNameInput('Space name');
    expect(this.dialogScope.remove.isDisabled()).toBe(false);
  });

  it('deletes space, refreshes token and calls onSuccess', function* () {
    this.setSpaceNameInput('Space name');
    yield this.dialogScope.remove.execute();

    sinon.assert.calledOnce(this.createEndpoint.withArgs(this.space.sys.id));
    sinon.assert.calledOnce(this.endpoint.withArgs({method: 'DELETE'}));
    sinon.assert.calledOnce(this.TokenStore.refresh);
    sinon.assert.calledOnce(this.onSuccess);
  });

  it('notifies about success and failure', function* () {
    this.setSpaceNameInput('Space name');
    yield this.dialogScope.remove.execute();
    sinon.assert.calledOnce(this.notification.info);

    this.endpoint.rejects();
    yield this.dialogScope.remove.execute();
    sinon.assert.calledOnce(this.ReloadNotification.basicErrorHandler);
  });
});
