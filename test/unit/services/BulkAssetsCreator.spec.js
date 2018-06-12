import * as sinon from 'helpers/sinon';
import {sortBy, map, max} from 'lodash';

const VERSION_MISMATCH_ERROR = { status: 409 };
const UNPROCESSABLE_ERROR = { status: 500 };

const PUBLISHABLE = true;
const UNPUBLISHABLE = false;

let $timeout;
let lastId;

describe('BulkAssetsCreator.tryToPublishProcessingAssets()', () => {
  beforeEach(function () {
    module('contentful/test');
    this.BulkAssetsCreator = this.$inject('services/BulkAssetsCreator');
    $timeout = this.$inject('$timeout');
    lastId = 0;
  });

  afterEach(() => {
    $timeout.flush();
    $timeout = null;
  });

  test('empty assets array', () => [
  ]);

  test('one processed at one second', () => [
    [newAssetProcessedAfter(1), PUBLISHABLE]
  ]);

  test('one processed at six seconds', () => [
    [newAssetProcessedAfter(6), PUBLISHABLE]
  ]);

  test('one processed after six seconds', () => [
    [newAssetProcessedAfter(6.1), UNPUBLISHABLE]
  ]);

  test('last processed first', () => [
    [newAssetProcessedAfter(6), PUBLISHABLE],
    [newAssetProcessedAfter(1), PUBLISHABLE]
  ]);

  test('all processed at six seconds', () => [
    [newAssetProcessedAfter(6), PUBLISHABLE],
    [newAssetProcessedAfter(6), PUBLISHABLE]
  ]);

  test('last unpublishable', () => [
    [newAssetProcessedAfter(6), PUBLISHABLE],
    [newAssetProcessedAfter(42), UNPUBLISHABLE]
  ]);

  test('all processed in two seconds or less', () => [
    [newAssetProcessedAfter(0.5), PUBLISHABLE],
    [newAssetProcessedAfter(1), PUBLISHABLE],
    [newAssetProcessedAfter(2), PUBLISHABLE]
  ]);

  test('all processed with more than one second inbetween (last first)', () => [
    [newAssetProcessedAfter(6), PUBLISHABLE],
    [newAssetProcessedAfter(5), PUBLISHABLE],
    [newAssetProcessedAfter(3), PUBLISHABLE],
    [newAssetProcessedAfter(1), PUBLISHABLE]
  ]);

  test('all processed with more than one second inbetween (last middle)', () => [
    [newAssetProcessedAfter(4), PUBLISHABLE],
    [newAssetProcessedAfter(2), PUBLISHABLE],
    [newAssetProcessedAfter(6), PUBLISHABLE],
    [newAssetProcessedAfter(4), PUBLISHABLE]
  ]);

  test('all processed with more than one second inbetween (last last)', () => [
    [newAssetProcessedAfter(1), PUBLISHABLE],
    [newAssetProcessedAfter(3), PUBLISHABLE],
    [newAssetProcessedAfter(5), PUBLISHABLE]
  ]);

  test('all processed in more than six seconds', () => [
    [newAssetProcessedAfter(6.5), UNPUBLISHABLE],
    [newAssetProcessedAfter(8.5), UNPUBLISHABLE],
    [newAssetProcessedAfter(42), UNPUBLISHABLE]
  ]);

  test('all processed within six seconds', () => [
    [newAssetProcessedAfter(0.5), PUBLISHABLE],
    [newAssetProcessedAfter(1), PUBLISHABLE],
    [newAssetProcessedAfter(6), PUBLISHABLE]
  ]);

  test('one not processable within six seconds (first)', () => [
    [newAssetProcessedAfter(7), UNPUBLISHABLE],
    [newAssetProcessedAfter(0.5), PUBLISHABLE],
    [newAssetProcessedAfter(3), PUBLISHABLE]
  ]);

  test('one not processable within six seconds (middle)', () => [
    [newAssetProcessedAfter(6), PUBLISHABLE],
    [newAssetProcessedAfter(7), UNPUBLISHABLE],
    [newAssetProcessedAfter(1), PUBLISHABLE]
  ]);

  test('one not processable within six seconds (last)', () => [
    [newAssetProcessedAfter(4), PUBLISHABLE],
    [newAssetProcessedAfter(6), PUBLISHABLE],
    [newAssetProcessedAfter(7), UNPUBLISHABLE]
  ]);

  test('unprocessable asset', () => [
    [newUnprocessableAsset(), UNPUBLISHABLE]
  ]);

  test('unprocessable asset is last', () => [
    [newAssetProcessedAfter(4), PUBLISHABLE],
    [newUnprocessableAsset(), UNPUBLISHABLE]
  ]);

  test('unprocessable asset is first', () => [
    [newUnprocessableAsset(), UNPUBLISHABLE],
    [newAssetProcessedAfter(6), PUBLISHABLE]
  ]);

  test('multiple unprocessable assets', () => [
    [newUnprocessableAsset(), UNPUBLISHABLE],
    [newUnprocessableAsset(), UNPUBLISHABLE]
  ]);
});

function test (msg, buildAssetsAndExpectations) {
  it(msg, function* () {
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

    const p = this.BulkAssetsCreator.tryToPublishProcessingAssets(assets);
    $timeout.flush(getTestTime(assets));
    const { publishedAssets, unpublishableAssets } = yield p;

    expect(sort(publishedAssets)).toEqual(sort(expectedPublishedAssets));
    expect(sort(unpublishableAssets)).toEqual(sort(expectedUnpublishableAssets));
  });

  function sort (assets) {
    return sortBy(assets, '__id');
  }
}

function newAssetProcessedAfter (seconds) {
  return processedAfter(seconds, newUnprocessedAsset());
}

function newUnprocessableAsset () {
  const asset = newUnprocessedAsset();
  asset.publish.rejects(UNPROCESSABLE_ERROR);
  return asset;
}

function newUnprocessedAsset () {
  return {
    __id: lastId++, // ID for sorting and more meaningful diffs on test failure.
    publish: sinon.stub().rejects(VERSION_MISMATCH_ERROR),
    setVersion: sinon.stub()
  };
}

function processedAfter (seconds, asset) {
  const ms = seconds * 1000;
  $timeout(ms).then(() => asset.publish.resolves(asset));
  asset.__processedAfter = ms;
  return asset;
}

function getTestTime (assets) {
  const processingTime = max(map(assets, '__processedAfter')) || 6000;
  return max([2000, Math.ceil(processingTime / 1000) * 1000]);
}
