import { forEach } from 'lodash';
import React from 'react';
import { render, fireEvent } from '@testing-library/react';

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
      const onCreateAndLink = jest.fn();
      const onLinkExisting = jest.fn();
      let allProps;

      beforeEach(() => {
        onCreateAndLink.mockReset();
        onLinkExisting.mockReset();
        allProps = { ...props, onCreateAndLink, onLinkExisting };
      });

      describe('"create and link" action', () => {
        if (expectedCreateAndLinkLabel) {
          it('is rendered', () => {
            const { getByTestId } = render(<LinkingActions {...allProps} />);
            expect(getByTestId(testIds.createAndLink).textContent).toEqual(
              expectedCreateAndLinkLabel
            );
          });

          it('invokes `onCreateAndLink` when clicked', () => {
            const { getByTestId } = render(<LinkingActions {...allProps} />);
            const createAndLink = getByTestId(testIds.createAndLink);
            try {
              // if the trigger is create-entry-link-button
              const button = getByTestId('create-entry-link-button');
              // we click on it to open the menu of available content types
              fireEvent.click(button);
              if (allProps.contentTypes.length > 1) {
                // and click the first one
                fireEvent.click(
                  getByTestId('add-entry-menu-container').querySelector(
                    '[data-test-id="cf-ui-dropdown-list-item-button"]'
                  )
                );
              }
            } catch (e) {
              // otherwise, just clicking the link
              fireEvent.click(createAndLink);
            } finally {
              expect(onCreateAndLink).toHaveBeenCalledTimes(1);
            }
          });
        } else {
          it('is hidden', () => {
            const { getAllByTestId } = render(<LinkingActions {...allProps} />);
            expect(() => {
              getAllByTestId(testIds.createAndLink);
            }).toThrow(`Unable to find an element by: [data-test-id="${testIds.createAndLink}"]`);
          });
        }
      });

      describe('"link existing" action', () => {
        it('is rendered', () => {
          const { getByTestId } = render(<LinkingActions {...allProps} />);
          expect(getByTestId(testIds.linkExisting).textContent).toEqual(expectedLinkExistingLabel);
        });

        it('invokes `onLinkExisting` when clicked', () => {
          const { getByTestId } = render(<LinkingActions {...allProps} />);
          fireEvent.click(getByTestId(testIds.linkExisting));
          expect(onLinkExisting).toHaveBeenCalledTimes(1);
        });
      });
    });
  });
});
