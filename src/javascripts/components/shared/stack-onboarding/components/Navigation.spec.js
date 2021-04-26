import React from 'react';
import _ from 'lodash';
import * as K from '__mocks__/kefirMock';
import * as NgRegistry from 'core/NgRegistry';
import * as TokenStore from 'services/TokenStore';
import * as CreateModernOnboardingUtils from 'components/shared/auto_create_new_space/CreateModernOnboardingUtils';
import Navigation from './Navigation';

import { render } from '@testing-library/react';

jest.mock('components/shared/auto_create_new_space/CreateModernOnboardingUtils');
jest.mock('services/TokenStore');

jest.mock('core/NgRegistry');

describe('Navigation', () => {
  let goStub;

  beforeEach(async function () {
    goStub = jest.fn();

    CreateModernOnboardingUtils.track = () => {};
    CreateModernOnboardingUtils.getStoragePrefix = jest.fn().mockReturnValue('prefix');
    CreateModernOnboardingUtils.isOnboardingComplete = jest.fn().mockReturnValue(false);

    TokenStore.user$ = K.createMockProperty({ sys: { id: 1 } });

    NgRegistry.getModule = () => ({ go: goStub });
  });

  afterEach(function () {
    goStub = null;
  });

  it('should have two active circles if active is 2', () => {
    const wrapper = render(<Navigation active={2} />);

    const activeElements = wrapper.queryAllByTestId(
      'modern-stack-onboarding--navigation-circle__active'
    );
    expect(activeElements).toHaveLength(2);
  });

  it('should call $state.go after clicking on the link', () => {
    const wrapper = render(<Navigation active={2} />);
    const found = wrapper.queryAllByTestId('modern-stack-onboarding--navigation-circle__active');
    found?.[0].click();

    expect(goStub).toHaveBeenCalled();
  });

  it('should not call $state.go after click on the next step', () => {
    const wrapper = render(<Navigation active={2} />);
    const found = wrapper.queryAllByTestId('modern-stack-onboarding--navigation-circle');
    found?.[found?.length - 1].click();
    expect(goStub).not.toHaveBeenCalled();
  });
});
