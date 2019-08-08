import { forEach } from 'lodash';
import { getEndpoint } from './Utils.es6';

describe('data/Request/Utils.es6', () => {
  describe('getEndpoint(url)', () => {
    const urlsByExpectedEndpoint = {
      '/spaces': ['https://api.contentful.com/spaces'],
      '/spaces/:id': ['https://api.contentful.com/spaces/id'],
      '/environments': ['https://api.contentful.com/spaces/space-id/environments'],
      '/environments/:id': ['https://api.contentful.com/spaces/space-id/environments/some-env-id'],
      '/organization_memberships': ['https://api.contentful.com/organization_memberships'],
      '/organization_memberships/:id': [
        'https://api.contentful.com/organization_memberships/some-id',
        'https://api.contentful.com/organization_memberships/some-id/THIS-WILL-BE-IGNORED'
      ],
      '/enforcements': ['//foo.bar/spaces/id/enforcements'],
      '/content_types': [
        'http://foo/spaces/space-id/content_types',
        'http://api.flinkly.com/spaces/space-id/environments/id/content_types'
      ],
      '/content_types/:id': ['http://foo/spaces/space-id/content_types/some-id'],
      '/entries': [
        'https://api.contentful.com/spaces/space-id/entries',
        'https://api.flinkly.com/spaces/space-id/environments/id/entries'
      ],
      '/entries/:id': [
        'https://api.flinkly.com/spaces/space-id/entries/some-entry_ID',
        'http://foo.com/spaces/i-_.d/entries/i-_.d',
        'https://api.contentful.com/spaces/id/entries/id-not-an-experiment.php',
        'https://api.flinkly.com/spaces/id/environments/id/entries/id',
        'https://api.flinkly.com/spaces/id/environments/id/entries/id/THIS-WILL-BE-IGNORED',
        // TODO: We probably want these as separate path just like comments:
        'https://api.flinkly.com/spaces/id/environments/id/entries/id/snapshots',
        'https://api.flinkly.com/spaces/id/environments/id/entries/id/snapshots/id'
      ],
      '/entries/:id/edit.php': [
        'https://api.flinkly.com/spaces/space-id/entries/some-entry_ID/edit.php?throttle=1000',
        'https://api.flinkly.com/spaces/id/environments/id/entries/id/edit.php'
      ],
      '/assets/:id': [
        'https://api.flinkly.com/spaces/space-id/assets/some-asset_ID',
        'https://api.contentful.com/spaces/i-_.d/environments/i-_.d/assets/i-_.d'
      ],
      '/assets/:id/experiment.php': [
        'https://api.flinkly.com/spaces/space-id/assets/some-asset_ID/experiment.php'
      ],
      '/:entity/:id/comments': ['https://api.flinkly.com/spaces/id/entries/id/comments'],
      '/:entity/:id/comments/:id': [
        'https://api.flinkly.com/spaces/id/entries/some-id/comments/some-id',
        'https://api.flinkly.com/spaces/id/assets/some-id/comments/id/THIS-WILL-BE-IGNORED'
      ]
    };

    forEach(urlsByExpectedEndpoint, (urls, expectedEndpoint) => {
      describe(expectedEndpoint, () => {
        urls.forEach(url => {
          it(`is returned for url ${url}`, () => {
            expect(getEndpoint(url)).toEqual(expectedEndpoint);
          });
        });
      });
    });
  });
});
