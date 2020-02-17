import getQueryStringParams from './getQueryStringParams';

describe('getQueryStringParams', () => {
  it('returns an object of parameters for a full url', () => {
    const testString = 'http://jesttest.com?name=test&value=2';
    const queryParams = getQueryStringParams(testString);
    expect(queryParams).toMatchObject({
      name: 'test',
      value: '2'
    });
  });

  it('returns an object of parameters for any string with query parameters', () => {
    const testString = 'name=test&value=2';
    const queryParams = getQueryStringParams(testString);
    expect(queryParams).toMatchObject({
      name: 'test',
      value: '2'
    });
  });

  it('returns an empty object if query undefined', () => {
    const queryParams = getQueryStringParams();
    expect(queryParams).toMatchObject({});
  });

  it('returns an empty object if no query params available', () => {
    const testString = 'justsomestring';
    const queryParams = getQueryStringParams(testString);
    expect(queryParams).toMatchObject({});
  });
});
