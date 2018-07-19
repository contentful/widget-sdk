import React from 'react';
import { mount } from 'enzyme';

import { createIsolatedSystem } from 'test/helpers/system-js';
import { BLOCKS, MARKS } from '@contentful/structured-text-types';

describe('StructuredTextEditor', () => {
  beforeEach(async function () {
    module('contentful/test');
    const mockDocument = {
      document: {}
    };
    this.props = {
      field: {
        getValue: sinon.stub.returns(mockDocument),
        setValue: sinon.stub()
      }
    };
    this.system = createIsolatedSystem();

    this.system.set('entitySelector', {});
    this.system.set('spaceContext', {
      cma: {
        getEntry: sinon.stub.resolves()
      }
    });
    this.system.set('states/EntityNavigationHelpers', {
      goToSlideInEntity: sinon.stub()
    });
    const { default: StructuredTextEditor } = await this.system.import(
      'app/widgets/structured_text/StructuredTextEditor'
    );

    this.wrapper = mount(<StructuredTextEditor {...this.props} />);
  });

  it('renders the component', function () {
    expect(this.wrapper).toBeDefined();
  });

  it('renders the toolbar icons', function () {
    const toolbarItems = [
      BLOCKS.HEADING_1,
      BLOCKS.HEADING_2,
      BLOCKS.ENTRY_LINK,
      MARKS.BOLD,
      MARKS.ITALIC,
      MARKS.UNDERLINED
    ];
    toolbarItems.forEach(item => {
      const el = this.wrapper.find(`[data-test-id="toolbar-toggle-${item}"]`);
      expect(el.length).toEqual(1);
      el.simulate('click');
      sinon.assert.calledOnce(this.props.field.setValue);
    });
  });
});
