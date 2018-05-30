import * as DOM from 'helpers/DOM';

describe('app/SpaceSettings/Environments', function () {
  beforeEach(function () {
    const resourceService = {
      canCreate: sinon.stub().withArgs('environment').resolves(true)
    };
    module('contentful/test', function ($provide) {
      $provide.value('services/ResourceService', () => resourceService);
    });

    const { createComponent } = this.$inject('app/SpaceSettings/Environments/State');
    const spaceContext = this.$inject('mocks/spaceContext').init();
    this.$inject('$state').href = () => 'href';

    this.container = DOM.createView($('<div class=client>').get(0));
    $(this.container.element).appendTo('body');

    this.init = () => {
      this.$compileWith('<cf-component-store-bridge component=component>', ($scope) => {
        $scope.component = createComponent(spaceContext);
      }).appendTo(this.container.element);
    };

    // Adds an environment to the store that backs the space endpoint
    // mock.
    this.putEnvironment = ({ id, status }) => {
      const envStore = spaceContext._mockEndpoint.stores.environments;
      envStore[id] = {
        sys: {
          id,
          status: { sys: { id: status } }
        }
      };
    };

    this.setCanCreate = (value) => {
      resourceService.canCreate.withArgs('environment').resolves(value);
    };
  });

  afterEach(function () {
    $(this.container.element).remove();
  });

  it('lists all environments with status', function () {
    this.putEnvironment({ id: 'e1', status: 'ready' });
    this.putEnvironment({ id: 'e2', status: 'queued' });
    this.putEnvironment({ id: 'e3', status: 'failed' });
    this.init();

    this.container.find('environmentList', 'environment.e1').assertHasText('e1');
    this.container.find('environmentList', 'environment.e1').assertHasText('Ready');
    this.container.find('environmentList', 'environment.e2').assertHasText('e2');
    this.container.find('environmentList', 'environment.e2').assertHasText('In progress');
    this.container.find('environmentList', 'environment.e3').assertHasText('e3');
    this.container.find('environmentList', 'environment.e3').assertHasText('Failed');
  });

  it('creates an environment', function () {
    this.init();

    this.container.find('openCreateDialog').click();
    this.$flush();
    this.container.find('spaceEnvironmentsEditDialog', 'field.id').setValue('env_id');
    this.container.find('spaceEnvironmentsEditDialog', 'submit').click();
    this.$flush();
    this.container.find('environmentList', 'environment.env_id').assertHasText('env_id');
  });

  it('deletes an environment', function () {
    this.putEnvironment({ id: 'e1', status: 'ready' });
    this.init();

    this.container.find('environment.e1', 'openDeleteDialog').click();
    this.$flush();
    this.container.find('spaceEnvironmentsDeleteDialog', 'confirmId').setValue('e1');
    this.container.find('spaceEnvironmentsDeleteDialog', 'delete').click();
    this.$flush();
    this.container.find('environment.e1').assertNonExistent();
  });

  it('disables create button if limit is reached', function () {
    this.setCanCreate(false);
    this.init();

    this.container.find('openCreateDialog').assertIsDisabled();
  });
});
