import React from 'react';
import Enzyme from 'enzyme';
import { IDPSetupForm } from './IDPSetupForm.es6';

describe('IDPSetupForm', () => {
  let identityProvider;

  const render = ({
    identityProvider,
    organization,
    updateFieldValue = () => {},
    validateField = () => {},
    fields = {
      idpName: {},
      ssoName: {},
      idpSsoTargetUrl: {},
      idpCert: {}
    }
  }) => {
    return Enzyme.shallow(
      <IDPSetupForm
        organization={organization}
        identityProvider={identityProvider}
        updateFieldValue={updateFieldValue}
        validateField={validateField}
        fields={fields}
      />
    );
  };

  const organization = {
    name: 'My Awesome Org',
    sys: {
      id: 'org_1234'
    }
  };

  beforeEach(() => {
    identityProvider = {
      sys: {
        version: 1
      }
    };
  });

  it('should validate a field on every change', () => {
    const validateField = jest.fn();

    const rendered = render({ identityProvider, organization, validateField });

    rendered
      .find('[testId="ssoName"]')
      .first()
      .simulate('change', { target: { value: 'li' } });
    rendered
      .find('[testId="ssoName"]')
      .first()
      .simulate('change', { target: { value: 'lill' } });
    rendered
      .find('[testId="ssoName"]')
      .first()
      .simulate('change', { target: { value: 'lilly' } });

    expect(validateField).toHaveBeenCalledTimes(3);
  });

  it('should update a field every 500ms on change', async () => {
    const updateFieldValue = jest.fn();

    const rendered = render({ identityProvider, organization, updateFieldValue });

    rendered
      .find('[testId="ssoName"]')
      .first()
      .simulate('change', { target: { value: 'li' } });
    rendered
      .find('[testId="ssoName"]')
      .first()
      .simulate('change', { target: { value: 'lill' } });
    rendered
      .find('[testId="ssoName"]')
      .first()
      .simulate('change', { target: { value: 'lilly' } });

    expect(updateFieldValue).not.toHaveBeenCalled();

    await new Promise(resolve => setTimeout(resolve, 550));

    expect(updateFieldValue).toHaveBeenCalledTimes(1);
  });

  it('should update a field immediately if input is blurred', () => {
    const updateFieldValue = jest.fn();

    const rendered = render({ identityProvider, organization, updateFieldValue });

    rendered
      .find('[testId="ssoName"]')
      .first()
      .simulate('blur', { target: { value: 'lilly' } });

    expect(updateFieldValue).toHaveBeenCalledTimes(1);
  });
});
