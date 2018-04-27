export const Steps = {
  SpaceCreateSteps: {
    SpaceType: 0,
    SpaceDetails: 1,
    Confirmation: 2
  },
  SpaceChangeSteps: {
    SpaceType: 0,
    Confirmation: 1
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
