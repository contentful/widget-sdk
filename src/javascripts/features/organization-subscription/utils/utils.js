import _ from 'lodash';

const UTILIZATION_THRESHOLD = 80;

export const utilizationState = ({ usage, limit, utilization }) => {
  let state = null;
  const percentage = Math.round(utilization * 100);
  const lowerLimitResource = limit < 5 && limit - usage === 1;

  if ((percentage >= UTILIZATION_THRESHOLD && percentage < 100) || lowerLimitResource) {
    state = 'APPROACHING';
  } else if (percentage === 100) {
    state = 'REACHED';
  } else if (percentage > 100) {
    state = 'EXCEEDED';
  } else {
    state = 'UNHANDLED';
  }

  return { state, percentage };
};

export function hasAnyInaccessibleSpaces(plans) {
  return plans.some((plan) => {
    const space = plan.space;
    return space && !space.isAccessible;
  });
}
