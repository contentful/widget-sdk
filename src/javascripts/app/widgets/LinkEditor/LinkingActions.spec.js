import { forEach } from 'lodash';
import React from 'react';
import Enzyme from 'enzyme';

import { default as LinkingActions, labels, testIds } from './LinkingActions';
import { TYPES } from './Util';

const contentTypes = [
  { name: 'CT one', sys: { id: 'CT1' } },
  { name: 'CT two', sys: { id: 'CT2' } }
];

describe('LinkingActions', () => {
  const testCases = {
    'for single entry': {
      props: { type: TYPES.ENTRY, isSingle: true, canCreateEntity: true, contentTypes },
      expectedCreateAndLinkLabel: labels.createAndLink('entry'),
      expectedLinkExistingLabel: labels.linkExisting('entry')
    },
    'for single asset': {
      props: { type: TYPES.ASSET, isSingle: true, canCreateEntity: true },
      expectedCreateAndLinkLabel: labels.createAndLink('asset'),
      expectedLinkExistingLabel: labels.linkExisting('asset')
    },
    'for multiple entries': {
      props: { type: TYPES.ENTRY, isSingle: false, canCreateEntity: true, contentTypes },
      expectedCreateAndLinkLabel: labels.createAndLink('entry'),
      expectedLinkExistingLabel: labels.linkExisting('entries')
    },
    'for multiple assets': {
      props: { type: TYPES.ASSET, isSingle: false, canCreateEntity: true },
      expectedCreateAndLinkLabel: labels.createAndLink('asset'),
      expectedLinkExistingLabel: labels.linkExisting('assets')
    },
    'without entry creation': {
      props: { type: TYPES.ENTRY, isSingle: false, canCreateEntity: false, contentTypes },
      expectedCreateAndLinkLabel: false,
      expectedLinkExistingLabel: labels.linkExisting('entries')
    },
    'without asset creation': {
      props: { type: TYPES.ASSET, isSingle: true, canCreateEntity: false },
      expectedCreateAndLinkLabel: false,
      expectedLinkExistingLabel: labels.linkExisting('asset')
    },
    'with only one content type': {
      props: {
        type: TYPES.ENTRY,
        isSingle: false,
        canCreateEntity: true,
        contentTypes: [contentTypes[0]]
      },
      expectedCreateAndLinkLabel: labels.createAndLink(contentTypes[0].name),
      expectedLinkExistingLabel: labels.linkExisting('entries')
    }
  };
  forEach(testCases, (testCase, description) => {
    const { props, expectedCreateAndLinkLabel, expectedLinkExistingLabel } = testCase;

    describe(description, () => {
      let wrapper, onCreateAndLink, onLinkExisting;

      beforeEach(() => {
        onCreateAndLink = jest.fn();
        onLinkExisting = jest.fn();
        const allProps = { ...props, onCreateAndLink, onLinkExisting };
        wrapper = Enzyme.mount(<LinkingActions {...allProps} />);
      });

      describe('"create and link" action', () => {
        let createAndLink;

        beforeEach(() => (createAndLink = byTestId(wrapper, testIds.createAndLink)));

        if (expectedCreateAndLinkLabel) {
          it('is rendered', () => {
            expect(createAndLink.text()).toEqual(expectedCreateAndLinkLabel);
          });

          it('invokes `onCreateAndLink` when clicked', () => {
            if (createAndLink.parent().is('CreateEntryMenuTrigger')) {
              const simulateClick = createAndLink.parent().prop('onSelect');
              simulateClick();
            } else {
              createAndLink.simulate('click');
            }
            expect(onCreateAndLink).toHaveBeenCalledTimes(1);
          });
        } else {
          it('is hidden', () => {
            expect(createAndLink).toHaveLength(0);
          });
        }
      });

      describe('"link existing" action', () => {
        let linkExisting;

        beforeEach(() => (linkExisting = byTestId(wrapper, testIds.linkExisting)));

        it('is rendered', () => {
          expect(linkExisting.text()).toEqual(expectedLinkExistingLabel);
        });

        it('invokes `onLinkExisting` when clicked', () => {
          linkExisting.simulate('click');
          expect(onLinkExisting).toHaveBeenCalledTimes(1);
        });
      });
    });
  });
});

function byTestId(wrapper, id) {
  return wrapper.find(`[data-test-id="${id}"]`).first();
}
