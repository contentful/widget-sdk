import { buildUrlWithUtmParams } from './utmBuilder';

const baseUrl = 'https://www.contentful.com';
const baseUrlWithParams = `${baseUrl}/?search=hey+there&locale=en-us`;
const baseUrlWithHash = `${baseUrl}/#title`;
const baseUrlWithParamsAndHash = `${baseUrl}/?search=hey+there&locale=en-us#title`;
const validUtmParams = {
  source: 'newsletter',
  medium: 'email',
  campaign: 'contentful-anniversary',
  content: 'cta-button',
  term: '20discount',
};

describe('buildUrlWithUtmParams', () => {
  it('should add the utm paramters to the current url', () => {
    const result = buildUrlWithUtmParams(validUtmParams)(baseUrl);

    expect(result).toBe(
      'https://www.contentful.com/?utm_source=newsletter&utm_medium=email&utm_campaign=contentful-anniversary&utm_content=cta-button&utm_term=20discount'
    );
  });

  it('should append the utm paramters to the current url with existing query parameters', () => {
    const result = buildUrlWithUtmParams(validUtmParams)(baseUrlWithParams);

    expect(result).toBe(
      'https://www.contentful.com/?search=hey+there&locale=en-us&utm_source=newsletter&utm_medium=email&utm_campaign=contentful-anniversary&utm_content=cta-button&utm_term=20discount'
    );
  });

  it('should return the url with existing hash', () => {
    const result = buildUrlWithUtmParams(validUtmParams)(baseUrlWithHash);

    expect(result).toBe(
      'https://www.contentful.com/?utm_source=newsletter&utm_medium=email&utm_campaign=contentful-anniversary&utm_content=cta-button&utm_term=20discount#title'
    );
  });

  it('should return the url with the utm params, existing query params and the hash', () => {
    const result = buildUrlWithUtmParams(validUtmParams)(baseUrlWithParamsAndHash);

    expect(result).toBe(
      'https://www.contentful.com/?search=hey+there&locale=en-us&utm_source=newsletter&utm_medium=email&utm_campaign=contentful-anniversary&utm_content=cta-button&utm_term=20discount#title'
    );
  });

  it('should throw if the required utm params are not provided', () => {
    const apply = buildUrlWithUtmParams({});

    expect(() => apply(baseUrlWithParamsAndHash)).toThrowError();
  });

  it('should throw if only source is provided', () => {
    const apply = buildUrlWithUtmParams({ source: 'hey' });

    expect(() => apply(baseUrlWithParamsAndHash)).toThrowError();
  });

  it('should throw if only campaign is provided', () => {
    const apply = buildUrlWithUtmParams({ campaign: 'ho' });

    expect(() => apply(baseUrlWithParamsAndHash)).toThrowError();
  });

  it('should throw if only medium is provided', () => {
    const apply = buildUrlWithUtmParams({ medium: 'lets go' });

    expect(() => apply(baseUrlWithParamsAndHash)).toThrowError();
  });

  it('should throw if no URL is provided', () => {
    const apply = buildUrlWithUtmParams(validUtmParams);

    expect(() => apply()).toThrowError();
  });

  it('should throw if URL is invalid', () => {
    const apply = buildUrlWithUtmParams(validUtmParams);

    expect(() => apply('invalid-url')).toThrowError();
  });

  it('should append https: if the URL starts with double slash', () => {
    const result = buildUrlWithUtmParams(validUtmParams)('//www.contentful.com');

    expect(result).toBe(
      'https://www.contentful.com/?utm_source=newsletter&utm_medium=email&utm_campaign=contentful-anniversary&utm_content=cta-button&utm_term=20discount'
    );
  });
});
