export default function SSOSelfConfiguration(eventName, data) {
  const [, action] = eventName.split(':');

  return {
    data: {
      executing_user_id: data.userId,
      organization_id: data.organizationId,
      action,

      // In the UI, this information is considered the "result"
      // of the connection test, but on Snowplow, it is considered
      // the connection test result status (because there can be
      // multiple results for one given flow).
      connection_test_result_status: data.result,
      connection_test_result_errors: data.errors
    }
  };
}
