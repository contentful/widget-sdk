import React from 'react';
import { render, screen } from '@testing-library/react';
import { IDPSetupForm } from './IDPSetupForm';
import * as Fake from 'test/helpers/fakeFactory';

const mockIdentityProvider = Fake.IdentityProvider();
const mockOrg = Fake.Organization();
const onUpdateMock = jest.fn();

describe('IDPSetupForm', () => {
  const build = () => {
    return render(
      <IDPSetupForm
        organization={mockOrg}
        identityProvider={mockIdentityProvider}
        onUpdate={onUpdateMock}
      />
    );
  };

  it('should show correct Audience URI', async () => {
    build();
    expect(screen.getByLabelText('Audience URI')).toHaveValue('https://app.contentful.com/');
  });

  it('should show correct ACS (Assertion Consumer Service) URL', async () => {
    build();
    expect(screen.getByLabelText('ACS (Assertion Consumer Service) URL')).toHaveValue(
      `https://be.contentful.com//sso/${mockOrg.sys.id}/consume`
    );
  });
});
