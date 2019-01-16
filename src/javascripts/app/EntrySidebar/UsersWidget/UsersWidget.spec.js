import React from 'react';
import Enzyme from 'enzyme';
import UsersWidget from './UsersWidget.es6';

describe('EntrySidebar/TranslationWidget', () => {
  const render = (props = {}, renderFn = Enzyme.shallow) => {
    const wrapper = renderFn(<UsersWidget {...props} />);
    return { wrapper };
  };

  it('it should show "No other users online" if users list is empty', () => {
    const { wrapper } = render({ users: [] }, Enzyme.mount);
    expect(wrapper).toMatchSnapshot();
    expect(wrapper).toIncludeText('No other users online');
  });

  it('it should render Collaborators component if users list is not empty', () => {
    const { wrapper } = render({ users: [{ sys: { id: '1' } }, { sys: { id: '2' } }] });
    expect(wrapper).toMatchSnapshot();
  });
});
