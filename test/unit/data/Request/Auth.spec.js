import sinon from 'sinon';
import { $initialize, $inject, $apply } from 'test/utils/ng';
import { it } from 'test/utils/dsl';

describe('data/Request/Auth', () => {
  beforeEach(async function () {
    const { default: wrapWithAuth } = await this.system.import('data/Request/Auth');

    await $initialize(this.system);

    this.getToken = sinon.stub().resolves('TOKEN');
    this.refreshToken = sinon.stub().resolves('REFRESHED TOKEN');
    this.baseRequest = sinon.stub().resolves();

    const auth = {
      getToken: this.getToken,
      refreshToken: this.refreshToken,
    };

    this.request = wrapWithAuth(auth, this.baseRequest);
  });

  it('makes request with authorization header', async function () {
    await this.request({});
    sinon.assert.calledWith(
      this.baseRequest,
      sinon.match({
        headers: { Authorization: 'Bearer TOKEN' },
      })
    );

    this.getToken.resolves('TOKEN 2');

    await this.request({});
    sinon.assert.calledWith(
      this.baseRequest,
      sinon.match({
        headers: { Authorization: 'Bearer TOKEN 2' },
      })
    );
  });

  it('keeps request params and returns base response', async function () {
    const baseResponse = {};
    this.baseRequest.resolves(baseResponse);

    const params = {
      method: 'GET',
      url: 'URL',
      headers: { H1: true },
    };
    const response = await this.request(params);

    expect(response).toBe(baseResponse);
    sinon.assert.calledWith(this.baseRequest, sinon.match(params));
  });

  it('rejects with base error', async function () {
    const baseError = {};
    this.baseRequest.rejects(baseError);

    const error = await this.request({}).catch((e) => e);
    expect(error).toBe(baseError);
  });

  it('retries with new token when base request responds with 401', async function () {
    const $q = $inject('$q');
    const firstResponse = $q.defer();
    this.baseRequest.onCall(0).returns(firstResponse.promise);
    this.baseRequest.onCall(1).returns($q.resolve());

    // Init request and update the current token
    const resultPromise = this.request({});
    $apply();
    this.getToken.resolves('NEW TOKEN');

    // Reject first request as unauthorized
    firstResponse.reject({ status: 401 });
    await resultPromise;

    expect(this.baseRequest.args[0][0].headers.Authorization).toBe('Bearer TOKEN');
    expect(this.baseRequest.args[1][0].headers.Authorization).toBe('Bearer NEW TOKEN');
  });

  it('refreshes token when base request responds with 401', async function () {
    const $q = $inject('$q');
    this.baseRequest.onCall(0).returns($q.reject({ status: 401 }));
    this.baseRequest.onCall(1).returns($q.resolve());
    await this.request({});

    sinon.assert.calledOnce(this.refreshToken);
    expect(this.baseRequest.args[0][0].headers.Authorization).toBe('Bearer TOKEN');
    expect(this.baseRequest.args[1][0].headers.Authorization).toBe('Bearer REFRESHED TOKEN');
  });
});
