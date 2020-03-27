import * as fake from 'test/helpers/fakeFactory';
import ResolveLinks, { fetchAndResolve } from './LinkResolver';

describe('LinkResolver', () => {
  describe('resolveLinks', () => {
    it('returns an unchanged array if no link paths are given', () => {
      const items = [fake.SpaceMembership(), fake.SpaceMembership()];

      const result = ResolveLinks({
        paths: [],
        includes: {},
        items,
      });

      expect(result).toEqual(items);
    });

    it('resolves a shallow link', () => {
      const user = fake.User('John', 'Doe');
      const result = ResolveLinks({
        paths: ['user'],
        includes: {
          User: [user],
        },
        items: [
          {
            foo: 'bar',
            user: fake.Link('User', user.sys.id),
          },
        ],
      });

      expect(result[0].user).toBe(user);
    });

    it('resolves a deep link', () => {
      const user = fake.User('John', 'Doe');
      const result = ResolveLinks({
        paths: ['membership.sys.user'],
        includes: {
          User: [user],
        },
        items: [
          {
            foo: 'bar',
            membership: {
              sys: {
                user: fake.Link('User', user.sys.id),
              },
            },
          },
        ],
      });

      expect(result[0].membership.sys.user).toBe(user);
    });

    it('resolves an array of links', () => {
      const spaces = [fake.Space(), fake.Space()];
      const result = ResolveLinks({
        paths: ['spaces'],
        includes: {
          Space: spaces,
        },
        items: [
          {
            foo: 'bar',
            spaces: [fake.Link('Space', spaces[0].sys.id), fake.Link('Space', spaces[1].sys.id)],
          },
        ],
      });

      expect(result[0].spaces).toEqual(spaces);
    });

    it('does not resolve a link if no object is found', () => {
      const link = fake.Link('Space');
      const space = fake.Space();
      const result = ResolveLinks({
        paths: ['spaces'],
        includes: {
          Space: [space],
        },
        items: [
          {
            foo: 'bar',
            spaces: [fake.Link('Space', space.sys.id), link],
          },
        ],
      });

      expect(result[0].spaces).toEqual([space, link]);
    });

    it('does not resolve a link if no collection is found in `includes`', () => {
      const link = fake.Link('Space');
      const result = ResolveLinks({
        paths: ['spaces'],
        includes: {},
        items: [
          {
            spaces: [link],
          },
        ],
      });

      expect(result[0].spaces).toEqual([link]);
    });
  });

  describe('fetchAndResolve', () => {
    it('receives a promise for a collection and returns it with resolved links in given paths', async () => {
      const spaces = [fake.Space(), fake.Space()];
      const originalResponse = {
        includes: {
          Space: spaces,
        },
        items: [
          fake.SpaceMembership(fake.Link('Space', spaces[0].sys.id)),
          fake.SpaceMembership(fake.Link('Space', spaces[1].sys.id)),
        ],
      };
      const promise = Promise.resolve(originalResponse);
      const resolved = await fetchAndResolve(promise, ['sys.space']);

      expect(resolved.map((membership) => membership.sys.space)).toEqual(spaces);
    });
  });
});
