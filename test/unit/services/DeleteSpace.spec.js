import sinon from 'sinon';
import { $initialize, $inject } from 'test/utils/ng';
import { it } from 'test/utils/dsl';

describe('DeleteSpace', () => {
  beforeEach(async function() {
    this.space = { sys: { id: 'SPACE_ID' }, name: 'Space name' };
    this.onSuccess = sinon.stub();

    this.createEndpoint = sinon.stub();
    this.TokenStore = { refresh: sinon.stub() };
    this.ReloadNotification = { basicErrorHandler: sinon.stub() };

    this.system.set('data/EndpointFactory.es6', { createSpaceEndpoint: this.createEndpoint });
    this.system.set('services/TokenStore.es6', this.TokenStore);
    this.system.set('app/common/ReloadNotification.es6', {
      default: this.ReloadNotification
    });

    this.ComponentLibrary = await this.system.import('@contentful/forma-36-react-components');
    this.ComponentLibrary.Notification.success = sinon.stub();

    this.openDeleteSpaceDialog = (await this.system.import(
      'services/DeleteSpace.es6'
    )).openDeleteSpaceDialog;

    await $initialize(this.system);

    this.modalDialog = $inject('modalDialog');
    this.modalDialog.richtextLayout = () => 'TEMPLATE';
    sinon.spy(this.modalDialog, 'open');
    this.endpoint = sinon.stub().resolves();
    this.createEndpoint.returns(this.endpoint);

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

  it('deletes space, refreshes token and calls onSuccess', async function() {
    this.setSpaceNameInput('Space name');
    await this.dialogScope.remove.execute();

    sinon.assert.calledOnce(this.createEndpoint.withArgs(this.space.sys.id));
    sinon.assert.calledOnce(this.endpoint.withArgs({ method: 'DELETE' }));
    sinon.assert.calledOnce(this.TokenStore.refresh);
    sinon.assert.calledOnce(this.onSuccess);
  });

  it('notifies about success and failure', async function() {
    this.setSpaceNameInput('Space name');
    await this.dialogScope.remove.execute();

    sinon.assert.calledOnce(this.ComponentLibrary.Notification.success);

    this.endpoint.rejects();
    await this.dialogScope.remove.execute();
    sinon.assert.calledOnce(this.ReloadNotification.basicErrorHandler);
  });

  it('closes the dialog on success', async function() {
    this.setSpaceNameInput('Space name');
    sinon.spy(this.dialogScope.dialog, 'confirm');
    await this.dialogScope.remove.execute();
    sinon.assert.calledOnce(this.dialogScope.dialog.confirm);
  });
});
