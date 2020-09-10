export const DEFAULT_MSG = `Something went wrong while changing the space type. Please retry or contact support if the problem persists.`;

export function formatError(error) {
  if (error?.statusCode === 422) {
    const errors = error?.data?.details?.errors;
    // we only want to show incompatibily errors to the customer
    if (errors[0].name === 'space') {
      return `This space is not compatible with the selected space type. ${errors[0].message}`;
    }
  }
  return DEFAULT_MSG;
}
