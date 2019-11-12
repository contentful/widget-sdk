import React from 'react';
import Enzyme from 'enzyme';
import NoLocalizedFieldsAdvice from '.';

describe('NoLocalizedFieldsAdvice', () => {
  const props = {
    localeName: 'German (Germany)'
  };

  const render = () => Enzyme.shallow(<NoLocalizedFieldsAdvice {...props} />);

  it('matches snapshot', () => {
    expect(render()).toMatchSnapshot();
  });
});
