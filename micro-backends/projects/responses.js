const makeResp = (statusCode, body) => {
  return {
    statusCode,
    body: body ? JSON.stringify(body) : JSON.stringify({}),
    headers: { 'Content-Type': 'application/json' }
  };
};

const ok = body => makeResp(200, body);
const notFound = () => makeResp(404);
const badRequest = () => makeResp(400);
const unprocessable = (message = 'Request is unprocessable') => makeResp(422, { message });

module.exports = {
  ok,
  notFound,
  badRequest,
  unprocessable
};
