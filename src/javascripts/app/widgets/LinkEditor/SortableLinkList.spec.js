import React from 'react';
import { noop } from 'lodash';
import { newLink, newAssetLink } from './__tests__/helpers.js';
import { linksToListItems } from './SortableLinkList';

describe('linksToListItems(links, renderLinkFn)', () => {
  it('handles empty link list', () => {
    expect(linksToListItems([], noop)).toEqual([]);
  });

  describe('returned items `key`', () => {
    it('is set with ":0" suffix if unique', () => {
      testIdsToKeys([newLink('ENTRY_1'), newLink('ENTRY_2')], ['ENTRY_1:0', 'ENTRY_2:0']);
    });

    it('has unique `key` for duplicate links', () => {
      const link1 = newLink('ENTRY_1');
      testIdsToKeys(
        [link1, newLink('ENTRY_2'), link1, link1],
        ['ENTRY_1:0', 'ENTRY_2:0', 'ENTRY_1:1', 'ENTRY_1:2']
      );
    });

    it('works with asset links as well', () => {
      const link1 = newAssetLink('ASSET_1');
      testIdsToKeys(
        [newAssetLink('ASSET_2'), newAssetLink('ASSET_3'), link1, link1],
        ['ASSET_2:0', 'ASSET_3:0', 'ASSET_1:0', 'ASSET_1:1']
      );
    });
  });

  describe('with 2nd argument `renderLinkFn`', () => {
    it("uses functions's return value as the items `value`", () => {
      const element = <div>value</div>;
      const items = linksToListItems([newLink()], () => element);
      expect(items[0]).toEqual(
        expect.objectContaining({
          value: element,
        })
      );
    });

    it('calls provided function for each link as fn(link, index)', () => {
      expect.assertions(4);
      const link1 = newLink();
      const links = [link1, newLink(), link1];
      const fn = jest.fn();
      linksToListItems(links, fn);
      expect(fn).toHaveBeenCalledTimes(links.length);
      for (let i = 0; i < links.length; i++) {
        expect(fn).toHaveBeenNthCalledWith(i + 1, links[i], i);
      }
    });
  });
});

function testIdsToKeys(links, expectedKeys) {
  const expectedItems = expectedKeys.map((key) => ({ key }));
  const items = linksToListItems(links, noop);
  expect(items).toEqual(expectedItems);
}
