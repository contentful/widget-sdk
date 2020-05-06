import wrapWithAuth from './Auth';

const auth = {
  getToken: jest.fn(async () => 'TOKEN'),
  refreshToken: jest.fn(async () => 'REFRESHED TOKEN'),
};
const baseRequest = jest.fn(() => Promise.resolve());
const request = wrapWithAuth(auth, baseRequest);

describe('Auth', () => {
  it('makes request with authorization header', async function () {
    await request({});
    expect(baseRequest).toHaveBeenCalledWith({
      headers: { Authorization: 'Bearer TOKEN' },
    });
  });

  it('keeps request params and returns base response', async function () {
    baseRequest.mockResolvedValueOnce('foo');
    const params = {
      method: 'GET',
      headers: { H1: true },
    };
    const response = await request(params);

    expect(response).toBe('foo');
    expect(baseRequest).toHaveBeenCalledWith({
      method: 'GET',
      headers: {
        H1: true,
        Authorization: 'Bearer TOKEN',
      },
    });
  });

  it('rejects with base error', async function () {
    const baseError = {};
    baseRequest.mockRejectedValueOnce(baseError);
    let error;
    await request({}).catch((e) => (error = e));
    expect(error).toBe(baseError);
  });

  it('retries with new token when base request responds with 401', async function () {
    baseRequest.mockRejectedValueOnce({ status: 401 });

    auth.getToken.mockResolvedValueOnce('OLD TOKEN').mockResolvedValueOnce('NEW TOKEN');

    await request({});

    expect(auth.getToken).toHaveBeenCalledTimes(2);
    expect(baseRequest).toHaveBeenNthCalledWith(2, {
      headers: { Authorization: 'Bearer NEW TOKEN' },
    });
  });

  it('refreshes token when base request responds with 401', async function () {
    baseRequest.mockRejectedValueOnce({ status: 401 });

    await request({});

    expect(auth.refreshToken).toHaveBeenCalledTimes(1);
    expect(baseRequest).toHaveBeenNthCalledWith(2, {
      headers: { Authorization: 'Bearer REFRESHED TOKEN' },
    });
  });
});
