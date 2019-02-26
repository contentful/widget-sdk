export default function SSOSelfConfiguration(eventName, data) {
  const [, action] = eventName.split(':');

  return {
    data: {
      executing_user_id: data.userId,
      organization_id: data.organizationId,
      action,

      // In the UI, we consider the information detailing the specific
      // result of the last connection test to be the "result", but
      // for clarity, in Snowplow, it is considered the "status".
      //
      // In other words, the connection test result "status" has the
      // same meaning as the "testConnectionResult" from the API.
      connection_test_result_status: data.result,
      connection_test_result_errors: data.errors
    }
  };
}
