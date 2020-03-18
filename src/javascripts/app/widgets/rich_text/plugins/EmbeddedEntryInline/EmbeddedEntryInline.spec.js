import React from 'react';
import { render, waitForElement } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import EmbeddedEntryInline from './EmbeddedEntryInline';
import WidgetAPIContext from 'app/widgets/WidgetApi/WidgetApiContext';
import ScheduledActionAction from 'app/ScheduledActions/ScheduledActionAction';
import { noop } from 'lodash';

describe('EmbeddedEntryInline component', () => {
  it('should render the scheduled icon if linked entry was scheduled', async () => {
    const entry = {
      sys: {
        type: 'Entry',
        id: 'ID',
        contentType: {
          sys: {
            id: 'CT-ID'
          }
        }
      }
    };

    const widgetAPIFake = {
      currentUrl: {
        pathname: '/'
      },
      space: {
        getEntry: jest.fn().mockResolvedValue(entry),
        getContentType: jest.fn().mockResolvedValue('User'),
        getEntityScheduledActions: jest.fn().mockResolvedValue([
          {
            action: ScheduledActionAction.Publish,
            sys: {
              id: entry.sys.id
            },
            entity: entry,
            scheduledFor: {
              datetime: new Date(Date.now() * 2).toUTCString()
            }
          }
        ])
      },
      field: {
        locale: 'en-US'
      },
      navigator: {
        onSlideInNavigation: jest.fn().mockReturnValue(noop)
      }
    };

    const props = {
      node: {
        data: {
          get: jest.fn().mockReturnValue(entry)
        }
      },
      widgetAPI: widgetAPIFake,
      isSelected: false,
      editor: {
        props: {
          actionsDisabled: false,
          readOnly: false
        }
      }
    };

    const { getByTestId } = render(
      <WidgetAPIContext.Provider value={{ widgetAPI: widgetAPIFake }}>
        <EmbeddedEntryInline {...props} />
      </WidgetAPIContext.Provider>
    );

    await waitForElement(() => getByTestId('scheduled-icon'));
  });
});
