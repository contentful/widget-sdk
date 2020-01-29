import React from 'react';
import { render } from '@testing-library/react';
import EnvironmentDetails from './EnvironmentDetails';

const getComponent = (props = {}) => {
  return (
    <EnvironmentDetails
      environmentId="release-1"
      hasCopy
      showAliasedTo
      isMaster
      isSelected
      isDefault
      createdAt={123456}
      {...props}
    />
  );
};

describe('EnvironmentDetails', () => {
  it('displays with copy button, default and createdAt', () => {
    const component = getComponent();
    const { getByTestId } = render(component);
    expect(getByTestId('envoralias.wrapper-active')).toBeInTheDocument();
    expect(getByTestId('environmentdetails.copy')).toBeInTheDocument();
    expect(getByTestId('environmentdetails.default')).toBeInTheDocument();
    expect(getByTestId('environmentdetails.createdAt')).toBeInTheDocument();
  });

  it('displays with copy button and createdAt', () => {
    const component = getComponent({ aliasId: 'master' });
    const { getByTestId } = render(component);
    expect(getByTestId('envoralias.wrapper-active')).toBeInTheDocument();
    expect(getByTestId('environmentdetails.copy')).toBeInTheDocument();
    const createdAt = getByTestId('environmentdetails.createdAt');
    expect(createdAt).toBeInTheDocument();
    expect(createdAt.innerHTML).toContain('Created');
    expect(() => getByTestId('environmentdetails.default')).toThrow();
  });

  it('displays without any additional details', () => {
    const component = getComponent({ isDefault: false, hasCopy: false, createdAt: undefined });
    const { getByTestId } = render(component);
    expect(getByTestId('envoralias.wrapper-active')).toBeInTheDocument();
    expect(() => getByTestId('environmentdetails.default')).toThrow();
    expect(() => getByTestId('environmentdetails.createdAt')).toThrow();
    expect(() => getByTestId('environmentdetails.copy')).toThrow();
  });
});
