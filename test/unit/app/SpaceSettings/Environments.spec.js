import * as DOM from 'helpers/DOM';

describe('app/SpaceSettings/Environments', function () {
  beforeEach(function () {
    module('contentful/test');

    const { createComponent } = this.$inject('app/SpaceSettings/Environments/State');
    const spaceContext = this.$inject('mocks/spaceContext').init();

    this.container = DOM.createView($('<div class=client>').get(0));
    $(this.container.element).appendTo('body');

    this.init = () => {
      this.$compileWith('<cf-component-store-bridge component=component>', ($scope) => {
        $scope.component = createComponent(spaceContext);
      }).appendTo(this.container.element);
    };

    // Adds an environment to the store that backs the space endpoint
    // mock.
    this.putEnvironment = ({ id, name, status }) => {
      const envStore = spaceContext._mockEndpoint.stores.environments;
      envStore[id] = {
        sys: {
          id,
          status: { sys: { id: status } }
        },
        name
      };
    };
  });

  afterEach(function () {
    $(this.container.element).remove();
  });

  it('lists all environments with status', function* () {
    this.putEnvironment({ id: 'e1', name: 'E1', status: 'ready' });
    this.putEnvironment({ id: 'e2', name: 'E2', status: 'queued' });
    this.putEnvironment({ id: 'e3', name: 'E3', status: 'failed' });
    this.init();

    this.container.find('environmentList', 'environment.e1').assertHasText('E1');
    this.container.find('environmentList', 'environment.e1').assertHasText('Ready');
    this.container.find('environmentList', 'environment.e2').assertHasText('E2');
    this.container.find('environmentList', 'environment.e2').assertHasText('In progress');
    this.container.find('environmentList', 'environment.e3').assertHasText('E3');
    this.container.find('environmentList', 'environment.e3').assertHasText('Failed');
  });

  it('creates an environment', function* () {
    this.init();

    this.container.find('openCreateDialog').click();
    this.$flush();
    this.container.find('spaceEnvironmentsEditDialog', 'field.name').setValue('ENV_NAME');
    this.container.find('spaceEnvironmentsEditDialog', 'submit').click();
    this.$flush();
    this.container.find('environmentList', 'environment.envName').assertHasText('ENV_NAME');
  });

  it('edits an environment', function* () {
    this.putEnvironment({ id: 'e1', name: 'NAME INITIAL', status: 'ready' });
    this.init();

    this.container.find('environment.e1').assertHasText('NAME INITIAL');
    this.container.find('environment.e1', 'openEditDialog').click();
    this.$flush();
    this.container.find('spaceEnvironmentsEditDialog', 'field.name').setValue('NAME CHANGED');
    this.container.find('spaceEnvironmentsEditDialog', 'submit').click();
    this.$flush();
    this.container.find('environment.e1').assertHasText('NAME CHANGED');
  });

  it('deletes an environment', function* () {
    this.putEnvironment({ id: 'e1', name: 'E1', status: 'ready' });
    this.init();

    this.container.find('environment.e1', 'openDeleteDialog').click();
    this.$flush();
    this.container.find('spaceEnvironmentsDeleteDialog', 'confirmName').setValue('E1');
    this.container.find('spaceEnvironmentsDeleteDialog', 'delete').click();
    this.$flush();
    this.container.find('environment.e1').assertNonExistent();
  });
});
