import { getFirstAccessibleSref } from './SectionAccess';
import { getSectionVisibility } from 'access_control/AccessChecker';

const mockAllTrue = {
  contentType: true,
  entry: true,
  asset: true,
  apiKey: true,
  settings: true,
};

jest.mock('access_control/AccessChecker', () => {
  // Importing the default module here in order to not overwrite the whole
  // thing when mocking `getSectionVisibility`. Because SectionAccess relies on
  // other functions in this file.
  const AccessChecker = jest.requireActual('access_control/AccessChecker');

  return {
    ...AccessChecker,
    getSectionVisibility: jest.fn(() => mockAllTrue),
  };
});

const adminSpace = {
  data: {
    spaceMember: {
      admin: true,
      roles: [],
    },
    activatedAt: null,
  },
};

const adminActivatedSpace = {
  data: {
    spaceMember: {
      admin: true,
      roles: [],
    },
    activatedAt: 'activatedAt',
  },
};

const customRoleSpace = {
  data: {
    spaceMember: {
      admin: false,
      roles: [{ name: 'Custom' }],
    },
    activatedAt: 'activatedAt',
  },
};

const authorSpace = {
  data: {
    spaceMember: {
      admin: false,
      roles: [{ name: 'Author' }],
    },
    activatedAt: 'activatedAt',
  },
};

const trialSpace = {
  data: {
    ...customRoleSpace.data,
    trialPeriodEndsAt: 'some day',
  },
};

describe('#getFirstAccessibleSref', () => {
  it('handles all-true scenario', () => {
    expect(getFirstAccessibleSref(customRoleSpace)).toBe('.entries.list');
  });

  it('handles some-true scenario', () => {
    getSectionVisibility.mockImplementationOnce(() => ({
      ...mockAllTrue,
      entry: false,
    }));
    expect(getFirstAccessibleSref(customRoleSpace)).toBe('.content_types.list');
  });

  it('handles all-false scenario', () => {
    getSectionVisibility.mockImplementationOnce(() => ({}));
    expect(getFirstAccessibleSref(customRoleSpace)).toBeNull();
  });

  it('handles all-false scenario with extra key', () => {
    getSectionVisibility.mockImplementationOnce(() => ({ extra: true }));
    expect(getFirstAccessibleSref(customRoleSpace)).toBeNull();
  });

  it('returns home screen sref when not activated and admin', () => {
    expect(getFirstAccessibleSref(adminSpace)).toBe('.home');
  });

  it('returns first available screen sref when activated and admin', () => {
    expect(getFirstAccessibleSref(adminActivatedSpace)).toBe('.entries.list');
  });

  it('returns home screen sref when user is author or editor', () => {
    expect(getFirstAccessibleSref(authorSpace)).toBe('.home');
  });

  it('returns home screen sref when space is a Trial Space', () => {
    expect(getFirstAccessibleSref(trialSpace)).toBe('.home');
  });
});
