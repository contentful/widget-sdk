import checkDependencies from './checkDependencies';

describe('checkDependencies', () => {
  it('throws if not all required dependencies are provided', () => {
    expect(() => {
      checkDependencies('SomeModuleName', { x: true }, ['x', 'y', 'z']);
    }).toThrow(/"y" not provided to SomeModuleName/);
  });

  it('does not throw if all dependencies are provided', () => {
    expect(() => {
      checkDependencies('SomeModuleName', { einz: 1, zwei: 2 }, ['einz', 'zwei']);
    }).not.toThrow();
  });

  it('checks for a key presence, the value can be falsy', () => {
    expect(() => {
      checkDependencies('SomeModuleName', { nil: null, undef: undefined, nein: false }, [
        'nil',
        'undef',
        'nein'
      ]);
    }).not.toThrow();
  });

  it('allows extra properties if required are provided', () => {
    expect(() => {
      checkDependencies('SomeModuleName', { test: true, extraProp: {} }, ['test']);
    }).not.toThrow();
  });

  it('returns dependencies passed', () => {
    const deps = { test: true };
    const checked = checkDependencies('X', deps, ['test']);
    expect(deps).toBe(checked);
  });
});
