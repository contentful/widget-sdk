import React from 'react';
import { mount } from 'enzyme';

import * as sinon from 'helpers/sinon';
import { createIsolatedSystem } from 'test/helpers/system-js';

import { BLOCKS } from '@contentful/structured-text-types';

const getToolbarIcon = wrapper =>
  wrapper.find(`[data-test-id="toolbar-toggle-${BLOCKS.EMBEDDED_ENTRY}"]`);

describe('EmbeddedEntryBlock', () => {
  beforeEach(async function() {
    module('contentful/test');
    const mockDocument = {
      content: []
    };
    this.system = createIsolatedSystem();

    this.system.set('ui/cf/thumbnailHelpers', {});
    this.system.set('spaceContext', {
      cma: {
        getEntry: sinon.stub().resolves()
      }
    });
    this.system.set('navigation/SlideInNavigator', {
      goToSlideInEntity: sinon.stub()
    });
    const { default: StructuredTextEditor } = await this.system.import(
      'app/widgets/structured_text/StructuredTextEditor'
    );

    this.widgetApi = this.$inject('mocks/widgetApi').create();
    this.widgetApi.fieldProperties.isDisabled$.set(false);
    this.widgetApi.fieldProperties.value$.set(mockDocument);

    this.props = {
      onChange: sinon.spy(),
      widgetAPI: { dialogs: {} }
    };
    this.wrapper = mount(<StructuredTextEditor {...this.props} />);
  });

  it('renders the component', function() {
    expect(getToolbarIcon(this.wrapper)).toBeDefined();
  });
});
