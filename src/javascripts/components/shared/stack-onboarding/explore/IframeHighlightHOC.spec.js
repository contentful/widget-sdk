import React from 'react';
import _ from 'lodash';

import { render } from '@testing-library/react';
import IframeHighlightHOC from './IframeHighlightHOC';

describe('IframeHighlightHOC', () => {
  let props, iframe;
  beforeEach(() => {
    const Elem = IframeHighlightHOC((passedProps) => {
      props = passedProps;
      return <div />;
    });
    iframe = {
      contentWindow: {
        postMessage: jest.fn(),
      },
    };
    render(<Elem iframe={iframe} />);
  });
  it('should add onHover and onLeave types', () => {
    expect(typeof props.onHover).toBe('function');
    expect(typeof props.onLeave).toBe('function');
  });

  it('should send postmessage to the iframe if onHover is called', () => {
    props.onHover('person');
    // we always send postMessages to clear all existing highlighting
    // so actual number of calls might be different
    expect(iframe.contentWindow.postMessage).toHaveBeenCalledTimes(6);
  });

  it('should have active highlight in state', () => {
    props.onHover('person');
    // we always send postMessages to clear all existing highlighting
    // so actual number of calls might be different
    expect(props.active).toBe('person');
  });
});
