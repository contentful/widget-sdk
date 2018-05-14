export const Steps = {
  SpaceCreateSteps: {
    SpaceType: 'space_type',
    SpaceDetails: 'space_details',
    Confirmation: 'confirmation'
  },
  SpaceChangeSteps: {
    SpaceType: 'space_type',
    Confirmation: 'confirmation'
  }
};

export const RequestState = {
  PENDING: 'pending',
  SUCCESS: 'success',
  ERROR: 'error'
};

export function formatPrice (value) {
  return parseInt(value, 10).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  });
}
