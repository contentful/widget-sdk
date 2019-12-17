import { sortBy } from 'lodash';
import * as BulkAssetsCreator from './BulkAssetsCreator';

jest.mock('delay', () => () => Promise.resolve());

const VERSION_MISMATCH_ERROR = { status: 409 };
const UNPROCESSABLE_ERROR = { status: 500 };

const PUBLISHABLE = true;
const UNPUBLISHABLE = false;

describe('BulkAssetsCreator.tryToPublishProcessingAssets()', () => {
  let lastId;
  let attempt;

  beforeEach(() => {
    attempt = 1;
    lastId = 1;
    jest.useFakeTimers();
    jest.setTimeout(15000);
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  runTest('empty assets array', () => []);
  runTest('one processed at one second', () => [[newAssetProcessedAfter(1), PUBLISHABLE]]);

  runTest('one processed at six seconds', () => [[newAssetProcessedAfter(6), PUBLISHABLE]]);

  runTest('one processed after six seconds', () => [[newAssetProcessedAfter(6.1), UNPUBLISHABLE]]);

  runTest('last processed first', () => [
    [newAssetProcessedAfter(1), PUBLISHABLE],
    [newAssetProcessedAfter(6), PUBLISHABLE]
  ]);

  runTest('all processed at six seconds', () => [
    [newAssetProcessedAfter(6), PUBLISHABLE],
    [newAssetProcessedAfter(6), PUBLISHABLE]
  ]);

  runTest('last unpublishable', () => [
    [newAssetProcessedAfter(6), PUBLISHABLE],
    [newAssetProcessedAfter(42), UNPUBLISHABLE]
  ]);

  runTest('all processed in two seconds or less', () => [
    [newAssetProcessedAfter(2), PUBLISHABLE],
    [newAssetProcessedAfter(1), PUBLISHABLE],
    [newAssetProcessedAfter(0.5), PUBLISHABLE]
  ]);

  runTest('all processed with more than one second inbetween (last first)', () => [
    [newAssetProcessedAfter(6), PUBLISHABLE],
    [newAssetProcessedAfter(5), PUBLISHABLE],
    [newAssetProcessedAfter(3), PUBLISHABLE],
    [newAssetProcessedAfter(1), PUBLISHABLE]
  ]);

  runTest('all processed with more than one second inbetween (last middle)', () => [
    [newAssetProcessedAfter(4), PUBLISHABLE],
    [newAssetProcessedAfter(2), PUBLISHABLE],
    [newAssetProcessedAfter(6), PUBLISHABLE],
    [newAssetProcessedAfter(4), PUBLISHABLE]
  ]);

  runTest('all processed with more than one second inbetween (last last)', () => [
    [newAssetProcessedAfter(1), PUBLISHABLE],
    [newAssetProcessedAfter(3), PUBLISHABLE],
    [newAssetProcessedAfter(5), PUBLISHABLE]
  ]);

  runTest('all processed in more than six seconds', () => [
    [newAssetProcessedAfter(6.5), UNPUBLISHABLE],
    [newAssetProcessedAfter(8.5), UNPUBLISHABLE],
    [newAssetProcessedAfter(42), UNPUBLISHABLE]
  ]);

  runTest('all processed within six seconds', () => [
    [newAssetProcessedAfter(0.5), PUBLISHABLE],
    [newAssetProcessedAfter(1), PUBLISHABLE],
    [newAssetProcessedAfter(6), PUBLISHABLE]
  ]);

  runTest('one not processable within six seconds (first)', () => [
    [newAssetProcessedAfter(0.5), PUBLISHABLE],
    [newAssetProcessedAfter(3), PUBLISHABLE],
    [newAssetProcessedAfter(16), UNPUBLISHABLE]
  ]);

  runTest('one not processable within six seconds (middle)', () => [
    [newAssetProcessedAfter(6), PUBLISHABLE],
    [newAssetProcessedAfter(18), UNPUBLISHABLE],
    [newAssetProcessedAfter(1), PUBLISHABLE]
  ]);

  runTest('one not processable within six seconds (last)', () => [
    [newAssetProcessedAfter(4), PUBLISHABLE],
    [newAssetProcessedAfter(6), PUBLISHABLE],
    [newAssetProcessedAfter(18), UNPUBLISHABLE]
  ]);

  runTest('unprocessable asset', () => [[newUnprocessableAsset(), UNPUBLISHABLE]]);

  runTest('unprocessable asset is last', () => [
    [newAssetProcessedAfter(4), PUBLISHABLE],
    [newUnprocessableAsset(), UNPUBLISHABLE]
  ]);

  runTest('unprocessable asset is first', () => [
    [newUnprocessableAsset(), UNPUBLISHABLE],
    [newAssetProcessedAfter(6), PUBLISHABLE]
  ]);

  runTest('multiple unprocessable assets', () => [
    [newUnprocessableAsset(), UNPUBLISHABLE],
    [newUnprocessableAsset(), UNPUBLISHABLE]
  ]);

  function runTest(msg, buildAssetsAndExpectations) {
    it(msg, function(done) {
      const assets = [];
      const expectedPublishedAssets = [];
      const expectedUnpublishableAssets = [];
      buildAssetsAndExpectations().forEach(([asset, publishable]) => {
        assets.push(asset);
        if (publishable) {
          expectedPublishedAssets.push(asset);
        } else {
          expectedUnpublishableAssets.push(asset);
        }
      });

      BulkAssetsCreator.tryToPublishProcessingAssets(assets).then(
        ({ publishedAssets, unpublishableAssets }) => {
          expect(sort(unpublishableAssets)).toEqual(sort(expectedUnpublishableAssets));
          expect(sort(publishedAssets)).toEqual(sort(expectedPublishedAssets));
          done();
        }
      );
    });

    function sort(assets) {
      return sortBy(assets, '__id');
    }
  }

  function processedAfter(seconds, asset) {
    asset.publish.mockImplementation(() => {
      if (++attempt >= seconds) {
        return Promise.resolve(asset);
      } else {
        return Promise.reject(VERSION_MISMATCH_ERROR);
      }
    });
    return asset;
  }

  function newAssetProcessedAfter(seconds) {
    return processedAfter(seconds, newUnprocessedAsset());
  }

  function newUnprocessableAsset() {
    const asset = newUnprocessedAsset();
    asset.publish.mockRejectedValueOnce(UNPROCESSABLE_ERROR);
    return asset;
  }

  function newUnprocessedAsset() {
    return {
      __id: lastId++, // ID for sorting and more meaningful diffs on test failure.
      publish: jest.fn().mockRejectedValue(VERSION_MISMATCH_ERROR),
      setVersion: jest.fn()
    };
  }
});
