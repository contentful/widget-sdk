import { flatMap } from 'lodash';
import { getEndpoint } from './Utils.es6';

describe('data/Request/Utils.es6', () => {
  describe('getEndpoint(url)', () => {
    const urlsByExpectedEndpoint = {
      '/entries/:id': [
        'https://api.flinkly.com/spaces/space-id/entries/some-entry_ID',
        'https://api.contentful.com/spaces/i-_.d/entries/i-_.d',
        'https://api.contentful.com/spaces/id/entries/id-not-an-experiment.php',
        'https://api.flinkly.com/spaces/id/environments/id/entries/id',
        // TODO: Fix /comments cases as they currently count towards wrong endpoint!
        'https://api.flinkly.com/spaces/id/entries/id/comments',
        'https://api.flinkly.com/spaces/id/entries/id/comments/id'
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
      ]
    };
    const urlsAndExpectedEndpoints = flatMap(urlsByExpectedEndpoint, (urls, endpoint) =>
      urls.map(url => [url, endpoint])
    );

    urlsAndExpectedEndpoints.forEach(([url, expectedEndpoint]) => {
      it(`returns endpoint ${expectedEndpoint} for url ${url}`, () => {
        expect(getEndpoint(url)).toEqual(expectedEndpoint);
      });
    });
  });
});
