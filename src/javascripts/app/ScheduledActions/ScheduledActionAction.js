const ScheduledActionAction = {
  Publish: 'publish',
  Unpublish: 'unpublish'
};

export const actionToLabelText = action => `${action.charAt(0).toUpperCase() + action.slice(1)} on`;

export default ScheduledActionAction;
