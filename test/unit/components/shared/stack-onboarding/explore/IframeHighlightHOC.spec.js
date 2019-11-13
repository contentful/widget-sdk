import React from 'react';
import _ from 'lodash';
import sinon from 'sinon';
import { $initialize } from 'test/utils/ng';

import { shallow } from 'enzyme';

describe('IframeHighlightHOC', () => {
  let IframeHighlightHOC, goStub;

  beforeEach(async function() {
    goStub = sinon.spy();

    IframeHighlightHOC = (await this.system.import(
      'components/shared/stack-onboarding/explore/IframeHighlightHOC'
    )).default;

    await $initialize(this.system, $provide => {
      $provide.value('$state', {
        go: goStub
      });
    });
  });

  afterEach(function() {
    IframeHighlightHOC = null;
  });

  it('should add onHover and onLeave types', () => {
    const Elem = IframeHighlightHOC(() => <div />);
    const wrapper = shallow(<Elem />);

    expect(typeof wrapper.props().onHover).toBe('function');
    expect(typeof wrapper.props().onLeave).toBe('function');
  });

  it('should send postmessage to the iframe if onHover is called', () => {
    const Elem = IframeHighlightHOC(() => <div />);
    const iframe = {
      contentWindow: {
        postMessage: sinon.spy()
      }
    };
    const wrapper = shallow(<Elem iframe={iframe} />);

    wrapper.props().onHover('person');

    // we always send postMessages to clear all existing highlighting
    // so actual number of calls might be different
    expect(iframe.contentWindow.postMessage.callCount > 0).toBe(true);
  });

  it('should have active highlight in state', () => {
    const Elem = IframeHighlightHOC(() => <div />);
    const iframe = {
      contentWindow: {
        postMessage: () => {}
      }
    };
    const wrapper = shallow(<Elem iframe={iframe} />);

    wrapper.props().onHover('person');

    // we always send postMessages to clear all existing highlighting
    // so actual number of calls might be different
    expect(wrapper.state().active).toBe('person');
  });
});
