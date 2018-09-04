import React from 'react';
import Enzyme from 'enzyme';
import { isBoolean } from 'lodash';

describe('app/Extensions', () => {
  let Extensions;

  const mount = props => {
    const extensions = props.extensions || [];
    const refresh = props.refresh || sinon.stub.resolves({});
    const isAdmin = isBoolean(props.isAdmin) ? props.isAdmin : true;
    const extensionUrl = props.extensionUrl || null;
    return Enzyme.mount(
      <Extensions
        extensions={extensions}
        refresh={refresh}
        isAdmin={isAdmin}
        extensionUrl={extensionUrl}
      />
    );
  };

  const extensions = [
    {
      id: 'builtin',
      name: 'Builtin',
      fieldTypes: ['Boolean'],
      parameters: ['one'],
      installationParameters: { definitions: ['some'], values: {} }
    },
    {
      custom: true,
      src: 'http://localhost',
      id: 'test',
      name: 'Widget 1',
      fieldTypes: ['Number'],
      parameters: [],
      installationParameters: { definitions: [], values: {} }
    },
    {
      custom: true,
      srcdoc: '<!doctype html',
      id: 'test2',
      name: 'Widget 2',
      fieldTypes: ['Symbol', 'Text'],
      parameters: [],
      installationParameters: { definitions: [], values: {} }
    }
  ];

  beforeEach(function() {
    module('contentful/test', $provide => {
      $provide.value('$state', {
        href: () => 'href',
        go: sinon.stub()
      });
      $provide.value('notification', {
        info: sinon.stub(),
        error: sinon.stub()
      });
      $provide.value('spaceContext', {
        cma: {
          createExtension: sinon.stub(),
          deleteExtension: sinon.stub()
        }
      });
    });

    Extensions = this.$inject('app/Extensions/Extensions.es6').default;
  });

  describe('if user is not an Admin', () => {
    it('shows forbidden view', () => {
      const wrapper = mount({
        isAdmin: false
      });
      expect(wrapper.exists("[data-test-id='extensions.forbidden']")).toEqual(true);

      expect(
        wrapper
          .find('.workbench-forbidden__message')
          .last()
          .text()
      ).toEqual('Contact the administrator of this space to get access.');
    });

    it('shows link if extensionUrl is passed', () => {
      const wrapper = mount({
        isAdmin: false,
        extensionUrl:
          'https://github.com/contentful/extensions/blob/master/samples/build-netlify/extension.json'
      });

      expect(wrapper.exists("[data-test-id='extensions.forbidden']")).toEqual(true);

      expect(
        wrapper
          .find('.workbench-forbidden__message')
          .last()
          .text()
      ).toEqual(
        'Share this URL with your admin so they can install it for you.https://app.contentful.com/deeplink?link=install-extension&url=https://github.com/contentful/extensions/blob/master/samples/build-netlify/extension.json'
      );
    });
  });

  describe('no custom widgets', () => {
    it('shows empty message', function() {
      const wrapper = mount({
        extensions: [],
        refresh: sinon.stub().resolves({})
      });
      expect(wrapper.exists("[data-test-id='extensions.empty']")).toEqual(true);
    });
  });

  describe('custom extensions exist', () => {
    it('lists extensions', function() {
      const wrapper = mount({
        extensions: extensions,
        refresh: sinon.stub.resolves({})
      });
      expect(wrapper.find("[data-test-id='extensions.list']").length).toEqual(1);

      const rows = wrapper.find('table tbody tr');
      expect(rows.length).toBe(3);

      const firstRow = rows.find('tr').at(0);
      const secondRow = rows.find('tr').at(1);
      const thirdRow = rows.find('tr').at(2);

      const getColText = (row, index) =>
        row
          .children()
          .at(index)
          .text();

      // name
      expect(getColText(firstRow, 0)).toEqual('Builtin');
      expect(getColText(secondRow, 0)).toEqual('Widget 1');
      expect(getColText(thirdRow, 0)).toEqual('Widget 2');

      // fiels types
      expect(getColText(firstRow, 2)).toEqual('Boolean');
      expect(getColText(secondRow, 2)).toEqual('Number');
      expect(getColText(thirdRow, 2)).toEqual('Symbol, Text');

      // instance params
      expect(getColText(firstRow, 3)).toEqual('1 definition(s)');
      expect(getColText(secondRow, 3)).toEqual('0 definition(s)');
      expect(getColText(thirdRow, 3)).toEqual('0 definition(s)');

      // installation parameters
      expect(getColText(firstRow, 4)).toEqual('1 definition(s)0 value(s)');
      expect(getColText(secondRow, 4)).toEqual('0 definition(s)0 value(s)');
      expect(getColText(thirdRow, 4)).toEqual('0 definition(s)0 value(s)');
    });

    it('navigates to single extension', function() {
      const wrapper = mount({
        extensions,
        refresh: sinon.stub.resolves({})
      });
      expect(this.$inject('$state').go.called).toBeFalsy();
      wrapper
        .find('a')
        .first()
        .simulate('click');
      expect(this.$inject('$state').go.called).toBeTruthy();
    });

    describe('delete extension', () => {
      it('deletes an extension', function() {
        const wrapper = mount({
          extensions,
          refresh: sinon.stub().resolves()
        });

        const deleteExtensionsStub = this.$inject('spaceContext').cma.deleteExtension.resolves({});

        wrapper.find("[data-test-id='extensions.delete.test2']").simulate('click');
        wrapper.find("[data-test-id='extensions.deleteConfirm.test2']").simulate('click');

        sinon.assert.calledWith(deleteExtensionsStub, 'test2');
      });
    });
  });

  describe('create extension', () => {
    it('creates a new extension', function() {
      const wrapper = mount({
        extensions,
        refresh: sinon.stub().resolves()
      });

      const createExtensionStub = this.$inject('spaceContext').cma.createExtension.resolves({
        sys: { id: 'newly-created' }
      });

      wrapper.find("[data-test-id='extensions.add']").simulate('click');
      wrapper.find("[data-test-id='extensions.add.new']").simulate('click');

      sinon.assert.calledOnce(createExtensionStub);
      const { extension } = createExtensionStub.lastCall.args[0];
      expect(extension.name).toBe('New extension');
      expect(extension.fieldTypes).toEqual([{ type: 'Symbol' }]);
      expect(extension.srcdoc.includes('https://unpkg.com/contentful-ui-extensions-sdk@3')).toBe(
        true
      );
    });
  });
});
