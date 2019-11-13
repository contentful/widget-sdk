import React from 'react';
import Enzyme from 'enzyme';

import DocumentTitle from './DocumentTitle';

import * as spaceContextMocked from 'ng/spaceContext';

describe('Document Title', () => {
  it('supports string titles', () => {
    const wrapper = Enzyme.shallow(<DocumentTitle title="Custom Title" />);

    assertTitle(wrapper, 'Custom Title — Contentful');
  });

  it('supports array titles', () => {
    const wrapper = Enzyme.shallow(<DocumentTitle title={['Custom Title', 'Media']} />);

    assertTitle(wrapper, 'Custom Title — Media — Contentful');
  });

  it('appends space name when in space context', () => {
    spaceContextMocked.getData.mockReturnValueOnce('Space Name');
    const wrapper = Enzyme.shallow(<DocumentTitle title="Custom Title" />);

    assertTitle(wrapper, 'Custom Title — Space Name — Contentful');
  });

  it('appends current environment id if multiple envs available', () => {
    spaceContextMocked.environments = [{}, {}];
    spaceContextMocked.getEnvironmentId.mockReturnValueOnce('master-1');
    const wrapper = Enzyme.shallow(<DocumentTitle title="Custom Title" />);

    assertTitle(wrapper, 'Custom Title — master-1 — Contentful');

    spaceContextMocked.environments = undefined;
  });
});

function assertTitle(wrapper, titleText) {
  expect(wrapper.find('title').text()).toBe(titleText);
}
