import { makeCtor, makeMatcher } from 'utils/TaggedValues';

describe('utils/TaggedValues', () => {
  it('names values with given tag', () => {
    const A = makeCtor('A');
    expect(A().name).toBe('A');
  });

  it('transforms constructor arguments', () => {
    const A = makeCtor(x => x + 1);
    expect(A(2).value).toBe(3);
  });

  it('matches tagged value with additional arguments and fallback', () => {
    const A = makeCtor();
    const B = makeCtor();
    const C = makeCtor();

    const go = makeMatcher({
      [A]: (_value, ...extra) => extra,
      [B]: value => value,
      _: (value, ...extra) => [value, ...extra]
    });

    expect(go(A(), 'X', 'Y')).toEqual(['X', 'Y']);
    expect(go(B('B'))).toEqual('B');
    expect(go(C('C'), 'X', 'Y')).toEqual([{ tag: C.tag, value: 'C' }, 'X', 'Y']);
  });
});
