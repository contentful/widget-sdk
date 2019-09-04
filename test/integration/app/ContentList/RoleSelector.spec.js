import * as DOM from 'test/helpers/DOM';
import createSpaceEndpoint from 'test/helpers/mocks/SpaceEndpoint';
import sinon from 'sinon';
import $ from 'jquery';
import { $initialize, $wait } from 'test/helpers/helpers';
import { beforeEach, it } from 'test/helpers/dsl';

describe('app/RoleSelector', () => {
  beforeEach(async function() {
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

    const ComponentLibrary = await this.system.import('@contentful/forma-36-react-components');
    ComponentLibrary.Notification.success = sinon.stub();
    this.Notification = ComponentLibrary.Notification;

    const { default: openRoleSelector } = await this.system.import(
      'app/ContentList/RoleSelector.es6'
    );

    await $initialize(this.system);

    this.open = initialValue => openRoleSelector(endpoint.request, initialValue);
  });

  afterEach(function() {
    this.$client.remove();
  });

  it('remove one role if it was visible to everybody', async function() {
    const resultPromise = this.open(undefined);

    await $wait();

    this.view.find('.roles.role-a').assertIsChecked(true);
    this.view.find('.roles.role-b').assertIsChecked(true);
    this.view.find('.roles.role-b').click();
    this.view.find('.apply-selection').click();

    const result = await resultPromise;
    expect(result).toEqual(['role-a']);
    sinon.assert.calledOnce(this.Notification.success);
  });

  it('selects all roles', async function() {
    const resultPromise = this.open(['role-a']);
    await $wait();

    this.view.find('.roles.role-a').assertIsChecked(true);
    this.view.find('.roles.role-b').assertIsChecked(false);
    this.view.find('.select-all').click();
    this.view.find('.apply-selection').click();

    const result = await resultPromise;
    expect(result).toEqual(undefined);
    sinon.assert.calledOnce(this.Notification.success);
  });

  it('selects no roles', async function() {
    const resultPromise = this.open(undefined);
    await $wait();

    this.view.find('.unselect-all').click();
    this.view.find('.apply-selection').click();

    const result = await resultPromise;
    expect(result).toEqual([]);
    sinon.assert.calledOnce(this.Notification.success);
  });
});
