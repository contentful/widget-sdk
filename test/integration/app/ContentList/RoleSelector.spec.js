import * as DOM from 'helpers/DOM';
import createSpaceEndpoint from 'helpers/mocks/SpaceEndpoint';
import * as sinon from 'helpers/sinon';

describe('app/RoleSelector', () => {
  beforeEach(function() {
    module('contentful/test');
    this.$client = $('<div class="client"/>');
    this.view = DOM.createView(this.$client.get(0));
    this.$client.appendTo('body');

    const endpoint = createSpaceEndpoint();
    const roleStore = endpoint.stores.roles;
    roleStore['role-a'] = {
      sys: { id: 'role-a' },
      name: 'Role A'
    };

    roleStore['role-b'] = {
      sys: { id: 'role-b' },
      name: 'Role B'
    };

    const ComponentLibrary = this.$inject('@contentful/ui-component-library');
    ComponentLibrary.Notification.success = sinon.stub();
    this.Notification = ComponentLibrary.Notification;

    const openRoleSelector = this.$inject('app/ContentList/RoleSelector.es6').default;

    this.open = initialValue => openRoleSelector(endpoint.request, initialValue);
  });

  afterEach(function() {
    this.$client.remove();
  });

  it('remove one role if it was visible to everybody', function*() {
    const resultPromise = this.open(undefined);

    this.view.find('.roles.role-a').assertIsChecked(true);
    this.view.find('.roles.role-b').assertIsChecked(true);
    this.view.find('.roles.role-b').click();
    this.view.find('.apply-selection').click();

    const result = yield resultPromise;
    expect(result).toEqual(['role-a']);
    sinon.assert.calledOnce(this.Notification.success);
  });

  it('selects all roles', function*() {
    const resultPromise = this.open(['role-a']);

    this.view.find('.roles.role-a').assertIsChecked(true);
    this.view.find('.roles.role-b').assertIsChecked(false);
    this.view.find('.select-all').click();
    this.view.find('.apply-selection').click();

    const result = yield resultPromise;
    expect(result).toEqual(undefined);
    sinon.assert.calledOnce(this.Notification.success);
  });

  it('selects no roles', function*() {
    const resultPromise = this.open(undefined);

    this.view.find('.unselect-all').click();
    this.view.find('.apply-selection').click();

    const result = yield resultPromise;
    expect(result).toEqual([]);
    sinon.assert.calledOnce(this.Notification.success);
  });
});
