import { forEach } from 'lodash';
import { getEndpoint } from './Utils';

describe('data/Request/Utils', () => {
  describe('getEndpoint(url)', () => {
    const urlsByExpectedEndpoint = {
      '/spaces': ['https://api.contentful.com/spaces'],
      '/spaces/:id': ['https://api.contentful.com/spaces/id'],
      '/environments': ['https://api.contentful.com/spaces/space-id/environments'],
      '/environments/:id': ['https://api.contentful.com/spaces/space-id/environments/some-env-id'],
      '/organizations': ['https://api.contentful.com/organizations'],
      '/organizations/:id': [
        'https://api.contentful.com/organizations/some-id',
        'https://api.contentful.com/organizations/some-id/foo',
      ],
      '/organization_memberships': ['https://api.contentful.com/organization_memberships'],
      '/organization_memberships/:id': [
        'https://api.contentful.com/organization_memberships/some-id',
        'https://api.contentful.com/organization_memberships/some-id/THIS-WILL-BE-IGNORED',
      ],
      '/enforcements': ['https://foo.bar/spaces/id/enforcements'],
      '/content_types': [
        'http://foo/spaces/space-id/content_types',
        'http://api.flinkly.com/spaces/space-id/environments/id/content_types',
      ],
      '/content_types/:id': [
        'http://foo/spaces/space-id/content_types/some-id',
        'http://foo/spaces/space-id/content_types/some-id?foo=bar',
      ],
      '/content_types/:id/editor_interface': [
        'http://foo/spaces/space-id/content_types/some-id/editor_interface',
        'http://foo/spaces/space-id/environments/foo/content_types/some-id/editor_interface',
      ],
      '/entries': [
        'https://api.contentful.com/spaces/space-id/entries',
        'https://api.contentful.com/spaces/space-id/entries?sys.id[in]=id1,id2&x=y',
        'https://api.flinkly.com/spaces/space-id/environments/id/entries',
      ],
      '/entries/:id': [
        'https://api.flinkly.com/spaces/space-id/entries/some-entry_ID',
        'http://foo.com/spaces/i-_.d/entries/i-_.d',
        'https://api.contentful.com/spaces/id/entries/id-not-an-experiment.php',
        'https://api.flinkly.com/spaces/id/environments/id/entries/id',
        'https://api.flinkly.com/spaces/id/environments/id/entries/id/THIS-WILL-BE-IGNORED',
      ],
      '/assets/:id': [
        'https://api.flinkly.com/spaces/space-id/assets/some-asset_ID',
        'https://api.contentful.com/spaces/i-_.d/environments/i-_.d/assets/i-_.d',
      ],
      '/:entity/:id/comments': ['https://api.flinkly.com/spaces/id/entries/id/comments'],
      '/:entity/:id/comments/:id': [
        'https://api.flinkly.com/spaces/id/entries/some-id/comments/some-id',
        'https://api.flinkly.com/spaces/id/assets/some-id/comments/id/THIS-WILL-BE-IGNORED',
      ],
      '/:entity/:id/tasks': ['https://api.foo.com/spaces/id/entries/id/tasks'],
      '/:entity/:id/tasks/:id': [
        'https://api.contentful.com/spaces/id/entries/some-id/tasks/some-id',
      ],
      '/:entity/:id/snapshots': ['http://foo.com/spaces/id/entries/id/snapshots'],
      '/:entity/:id/snapshots/:id': [
        'https://api.flinkly.com/spaces/some-id/entries/some-id/snapshots/some-id',
        'https://api.flinkly.com/spaces/i-_.d/assets/some-id/snapshots/i-_.d/THIS-WILL-BE-IGNORED',
        'https://api.flinkly.com/spaces/some-id/entries/some-id/snapshots/some-id?foo=bar',
      ],
      '/:entity/:id/references': ['http://foo.com/spaces/id/entries/entry-id/references'],
      '/:orgOrSpace/:id/product_catalog_features': [
        'https://api.contentful.com/organizations/7Ar55sWSKhrqTaY0EhdmRk/product_catalog_features',
        'https://api.contentful.com/spaces/0gti8l47imxh/product_catalog_features?sys.id=foo',
        'https://api.contentful.com/spaces/0gti8l47imxh/environments/foo/product_catalog_features',
      ],
    };

    forEach(urlsByExpectedEndpoint, (urls, expectedEndpoint) => {
      describe(expectedEndpoint, () => {
        urls.forEach((url) => {
          it(`is returned for url ${url}`, () => {
            expect(getEndpoint(url)).toEqual(expectedEndpoint);
          });
          const path = new URL(url).pathname;
          it(`is returned for path ${path}`, () => {
            expect(getEndpoint(path)).toEqual(expectedEndpoint);
          });
        });
      });
    });
  });
});
