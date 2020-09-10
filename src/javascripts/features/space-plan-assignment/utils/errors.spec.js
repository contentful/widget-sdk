import * as errors from './errors';

const mockDefaultError = { statusCode: 400, data: { message: 'Horrible API error.' } };
const mockBaseError = {
  statusCode: 422,
  data: {
    message: 'Something went terribly wrong',
    details: { errors: [{ name: 'base', message: 'There was a Zuora error.' }] },
  },
};
const mockSpaceError = {
  statusCode: 422,
  data: {
    message: 'Something went terribly wrong',
    details: {
      errors: [
        {
          name: 'space',
          message: 'Locales was found to exceed the 46 maximum Locales of this plan.',
        },
      ],
    },
  },
};
const mockOrganizationError = {
  statusCode: 422,
  data: {
    message: 'Something went terribly wrong',
    details: {
      errors: [
        {
          name: 'organization',
          message: 'must have a zuora account',
        },
      ],
    },
  },
};
const mockRatePlanError = {
  statusCode: 422,
  data: {
    message: 'Something went terribly wrong',
    details: {
      errors: [
        {
          name: 'rate_plan',
          message: 'The space you provided is already assigned to another plan',
        },
      ],
    },
  },
};

describe('Space Plan Assignment errors #formatError', () => {
  it('should return default message if statusCode not 422', () => {
    expect(errors.formatError(mockDefaultError)).toEqual(errors.DEFAULT_MSG);
  });

  it('should return default message if statusCode is 422 and error type base', () => {
    expect(errors.formatError(mockBaseError)).toEqual(errors.DEFAULT_MSG);
  });

  it('should return default message if statusCode is 422 and error type organization', () => {
    expect(errors.formatError(mockOrganizationError)).toEqual(errors.DEFAULT_MSG);
  });

  it('should return default message if statusCode is 422 and error type rate_plan', () => {
    expect(errors.formatError(mockRatePlanError)).toEqual(errors.DEFAULT_MSG);
  });

  it('should return custom message if statusCode is 422 and error type space', () => {
    expect(errors.formatError(mockSpaceError)).toEqual(
      'This space is not compatible with the selected space type. Locales was found to exceed the 46 maximum Locales of this plan.'
    );
  });
});
