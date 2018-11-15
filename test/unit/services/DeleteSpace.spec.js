import * as sinon from 'helpers/sinon';

describe('DeleteSpace', () => {
  beforeEach(function() {
    this.space = { sys: { id: 'SPACE_ID' }, name: 'Space name' };
    this.onSuccess = sinon.stub();

    this.createEndpoint = sinon.stub();
    this.TokenStore = { refresh: sinon.stub() };
    this.ReloadNotification = { basicErrorHandler: sinon.stub() };

    module('contentful/test', $provide => {
      $provide.value('data/EndpointFactory.es6', { createSpaceEndpoint: this.createEndpoint });
      $provide.value('services/TokenStore.es6', this.TokenStore);
      $provide.value('ReloadNotification', this.ReloadNotification);
    });

    this.modalDialog = this.$inject('modalDialog');
    this.ComponentLibrary = this.$inject('@contentful/ui-component-library');
    this.ComponentLibrary.Notification.success = sinon.stub();
    this.modalDialog.richtextLayout = () => 'TEMPLATE';
    sinon.spy(this.modalDialog, 'open');
    this.endpoint = sinon.stub().resolves();
    this.createEndpoint.returns(this.endpoint);
    this.openDeleteSpaceDialog = this.$inject('services/DeleteSpace.es6').openDeleteSpaceDialog;

    this.openDeleteSpaceDialog({ space: this.space, onSuccess: this.onSuccess });
    this.dialogScope = this.modalDialog.open.firstCall.args[0].scope;

    this.setSpaceNameInput = value => {
      this.dialogScope.input.spaceName = value;
      this.dialogScope.$digest();
    };
  });

  it('opens dialog and sets space data on scope', function() {
    sinon.assert.calledOnce(
      this.modalDialog.open.withArgs(
        sinon.match({
          template: 'TEMPLATE',
          noNewScope: true,
          scope: sinon.match.object
        })
      )
    );
    expect(this.dialogScope.spaceName).toBe('Space name');
    expect(this.dialogScope.input).toBeDefined();
  });

  it('enables deleting only when input matches space name', function() {
    this.setSpaceNameInput('Not space name');
    expect(this.dialogScope.remove.isDisabled()).toBe(true);
    this.setSpaceNameInput('Space name');
    expect(this.dialogScope.remove.isDisabled()).toBe(false);
  });

  it('deletes space, refreshes token and calls onSuccess', function*() {
    this.setSpaceNameInput('Space name');
    yield this.dialogScope.remove.execute();

    sinon.assert.calledOnce(this.createEndpoint.withArgs(this.space.sys.id));
    sinon.assert.calledOnce(this.endpoint.withArgs({ method: 'DELETE' }));
    sinon.assert.calledOnce(this.TokenStore.refresh);
    sinon.assert.calledOnce(this.onSuccess);
  });

  it('notifies about success and failure', function*() {
    this.setSpaceNameInput('Space name');
    yield this.dialogScope.remove.execute();

    sinon.assert.calledOnce(this.ComponentLibrary.Notification.success);

    this.endpoint.rejects();
    yield this.dialogScope.remove.execute();
    sinon.assert.calledOnce(this.ReloadNotification.basicErrorHandler);
  });

  it('closes the dialog on success', function*() {
    this.setSpaceNameInput('Space name');
    sinon.spy(this.dialogScope.dialog, 'confirm');
    yield this.dialogScope.remove.execute();
    sinon.assert.calledOnce(this.dialogScope.dialog.confirm);
  });
});
