import { validate } from './AppEditor';

describe('validate', () => {
  it('accepts a valid definition', () => {
    const definition = {
      name: 'Test App',
      src: 'https://httpbin.org/post',
      locations: [{ location: 'dialog' }],
    };

    const result = validate(definition);
    expect(result).toStrictEqual([]);
  });

  it('returns error for empty name', () => {
    const definition = {
      name: '',
      src: 'https://httpbin.org/post',
      locations: [{ location: 'dialog' }],
    };

    const result = validate(definition);
    expect(result).toHaveLength(1);
    expect(result[0].path).toStrictEqual(['name']);
  });

  it('returns no error for empty url', () => {
    const definition = {
      name: 'Test app',
      src: '',
      locations: [{ location: 'dialog' }],
    };

    const result = validate(definition);
    expect(result).toStrictEqual([]);
  });

  it('returns error for http url', () => {
    const definition = {
      name: 'Test app',
      src: 'http://httpbin.org/post',
      locations: [{ location: 'dialog' }],
    };

    const result = validate(definition);
    expect(result).toHaveLength(1);
    expect(result[0].path).toStrictEqual(['src']);
  });

  ['http://localhost:1234', 'http://localhost', 'http://localhost:1234/contentful'].forEach(
    (src) => {
      it(`returns no error for localhost url: ${src}`, () => {
        const definition = {
          name: 'Test app',
          src: 'http://localhost:1234',
          locations: [{ location: 'dialog' }],
        };

        const result = validate(definition);
        expect(result).toHaveLength(0);
      });
    }
  );

  it('returns error for empty link name', () => {
    const definition = {
      name: 'Test app',
      src: 'https://httpbin.org/post',
      locations: [
        { location: 'dialog' },
        { location: 'page', navigationItem: { name: '', path: '/' } },
      ],
    };

    const result = validate(definition);
    expect(result).toHaveLength(1);
    expect(result[0].path).toStrictEqual(['locations', 'page', 'navigationItem', 'name']);
  });

  it('returns error for an invalid path', () => {
    const definition = {
      name: 'Test app',
      src: 'https://httpbin.org/post',
      locations: [
        { location: 'dialog' },
        { location: 'page', navigationItem: { name: 'Link name', path: 'invalid-link' } },
      ],
    };

    const result = validate(definition);
    expect(result).toHaveLength(1);
    expect(result[0].path).toStrictEqual(['locations', 'page', 'navigationItem', 'path']);
  });

  it('returns error for missing instance parameter id', () => {
    const definition = {
      name: 'Test app',
      src: 'https://httpbin.org/post',
      locations: [{ location: 'dialog' }],
      parameters: {
        instance: [{ id: '', name: 'Name', type: 'Symbol' }],
      },
    };

    const result = validate(definition);
    expect(result).toHaveLength(1);
    expect(result[0].path).toStrictEqual(['parameters', 'instance', 0, 'id']);
  });

  it('returns error for invalid instance parameter id', () => {
    const definition = {
      name: 'Test app',
      src: 'https://httpbin.org/post',
      locations: [{ location: 'dialog' }],
      parameters: {
        instance: [{ id: '_invalid', name: 'Name', type: 'Symbol' }],
      },
    };

    const result = validate(definition);
    expect(result).toHaveLength(1);
    expect(result[0].path).toStrictEqual(['parameters', 'instance', 0, 'id']);
  });

  it('returns error for missing instance parameter name', () => {
    const definition = {
      name: 'Test app',
      src: 'https://httpbin.org/post',
      locations: [{ location: 'dialog' }],
      parameters: {
        instance: [{ id: 'name', name: '', type: 'Symbol' }],
      },
    };

    const result = validate(definition);
    expect(result).toHaveLength(1);
    expect(result[0].path).toStrictEqual(['parameters', 'instance', 0, 'name']);
  });
});
