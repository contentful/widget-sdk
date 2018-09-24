import React from 'react';
import { mount } from 'enzyme';

import FetchEntry from 'app/widgets/structured_text/plugins/shared/FetchEntity/FetchEntity.es6';
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

    this.props = {
      entityId: this.entity.sys.id,
      entityType: 'Entry',
      currentUrl: '//current-url',
      render: sinon.spy(() => null),
      $services: getMockedServices(this.entity, this.contentType, this.thumbnail)
    };

    this.wrapper = mount(<FetchEntry {...this.props} />);
  });

  it('fetches entry with id from `entryId`', async function() {
    await flushPromises();
    const { render } = this.props;
    sinon.assert.callCount(render, 3);
    expect(render.args[0][0]).toEqual({
      entry: { sys: { contentType: { sys: {} } }, fields: {} },
      requestStatus: RequestStatus.Pending
    });
    expect(render.args[1][0]).toEqual(render.args[0][0]);
    sinon.assert.calledWithExactly(render, {
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
