import ResolveLinks from './LinkResolver.es6';

describe('LinkResolver', () => {
  it('returns an unchanged array if no link paths are given', () => {
    const items = [
      {
        foo: 'bar',
        bar: 'foo'
      }
    ];

    const result = ResolveLinks({
      paths: [],
      includes: {},
      items
    });

    expect(result).toEqual(items);
  });

  it('resolves a shallow link', () => {
    const user = { name: 'John', sys: { id: 9 } };
    const result = ResolveLinks({
      paths: ['user'],
      includes: {
        User: [user]
      },
      items: [
        {
          foo: 'bar',
          user: {
            sys: {
              linkType: 'User',
              id: 9
            }
          }
        }
      ]
    });

    expect(result[0].user).toBe(user);
  });

  it('resolves a deep link', () => {
    const user = { name: 'John', sys: { id: 9 } };
    const result = ResolveLinks({
      paths: ['membership.sys.user'],
      includes: {
        User: [user]
      },
      items: [
        {
          foo: 'bar',
          membership: {
            sys: {
              user: {
                sys: {
                  linkType: 'User',
                  id: 9
                }
              }
            }
          }
        }
      ]
    });

    expect(result[0].membership.sys.user).toBe(user);
  });

  it('resolves an array of links', () => {
    const roles = [
      {
        name: 'Editor',
        sys: { id: 'x' }
      },
      {
        name: 'Translator',
        sys: { id: 'y' }
      }
    ];
    const result = ResolveLinks({
      paths: ['roles'],
      includes: {
        Role: roles
      },
      items: [
        {
          foo: 'bar',
          roles: [
            {
              sys: {
                linkType: 'Role',
                id: 'x'
              }
            },
            {
              sys: {
                linkType: 'Role',
                id: 'y'
              }
            }
          ]
        }
      ]
    });

    expect(result[0].roles).toEqual(roles);
  });
});
