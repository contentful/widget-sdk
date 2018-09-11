import React from 'react';
import { mount } from 'enzyme';
import _ from 'lodash';
import Immutable from 'immutable';

import FetchEntry from 'app/widgets/structured_text/plugins/shared/FetchEntry/FetchEntry.es6';
import RequestStatus from 'app/widgets/structured_text/plugins/shared/RequestStatus.es6';
import * as sinon from 'helpers/sinon';
import { flushPromises } from '../helpers';

const getMockedServices = (entry, contentType, thumbnail) => {
  return {
    spaceContext: {
      space: {
        getEntry: sinon.spy(() => Promise.resolve({ data: entry })),
        getContentType: sinon.spy(() => Promise.resolve(contentType))
      },
      entryImage: sinon.spy(() => Promise.resolve(thumbnail)),
      entryTitle: sinon.spy(() => 'entry-title'),
      entityDescription: sinon.spy(() => 'entry-description')
    }
  };
};

describe('FetchEntry', () => {
  beforeEach(async function() {
    module('contentful/test');

    this.entity = {
      sys: {
        type: 'Entry',
        id: 'testid2',
        contentType: {
          sys: {
            id: 'ct-id'
          }
        }
      }
    };
    this.contentType = {
      data: {
        name: 'content-type-name'
      }
    };

    this.thumbnail = {};
    this.node = {
      data: Immutable.Map({
        target: {
          sys: {
            id: this.entity.sys.id
          }
        }
      })
    };

    this.props = {
      node: this.node,
      currentUrl: '//current-url',
      render: sinon.spy(() => null),
      $services: getMockedServices(this.entity, this.contentType, this.thumbnail)
    };

    this.wrapper = mount(<FetchEntry {...this.props} />);
  });

  it('fetches entry with id from node target', async function() {
    await flushPromises();
    const { render } = this.props;
    sinon.assert.callCount(render, 3);
    sinon.assert.calledWith(render, {
      entry: { sys: { contentType: { sys: {} } }, fields: {} },
      requestStatus: RequestStatus.Pending
    });
    sinon.assert.calledWith(render, {
      entry: { sys: { contentType: { sys: {} } }, fields: {} },
      requestStatus: RequestStatus.Pending
    });
    sinon.assert.calledWith(render, {
      entry: this.entity,
      requestStatus: RequestStatus.Success,
      entryWrapper: {
        data: this.entity
      },
      contentTypeName: 'content-type-name',
      entryTitle: 'entry-title',
      entryDescription: 'entry-description',
      entryStatus: 'draft'
    });
  });
});
