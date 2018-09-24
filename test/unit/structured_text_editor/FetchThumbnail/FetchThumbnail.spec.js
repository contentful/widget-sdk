import React from 'react';
import { mount } from 'enzyme';
import _ from 'lodash';
import Immutable from 'immutable';

import FetchThumbnail from 'app/widgets/structured_text/plugins/shared/FetchThumbnail/FetchThumbnail.es6';
import RequestStatus from 'app/widgets/structured_text/plugins/shared/RequestStatus.es6';
import * as sinon from 'helpers/sinon';
import { flushPromises } from '../helpers';

const getMockedServices = thumbnail => {
  return {
    spaceContext: {
      entryImage: sinon.spy(() => Promise.resolve(thumbnail))
    }
  };
};

describe('FetchThumbnail', () => {
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
      entry: { data: this.entity },
      render: sinon.spy(() => null),
      $services: getMockedServices(this.thumbnail)
    };

    this.wrapper = mount(<FetchThumbnail {...this.props} />);
  });

  it('fetches thumbnail', async function() {
    await flushPromises();
    const { render } = this.props;
    sinon.assert.callCount(render, 3);
    sinon.assert.calledWith(render, {
      thumbnail: null,
      requestStatus: RequestStatus.Pending
    });
    sinon.assert.calledWith(render, {
      thumbnail: null,
      requestStatus: RequestStatus.Pending
    });
    sinon.assert.calledWith(render, {
      thumbnail: this.thumbnail,
      requestStatus: RequestStatus.Success
    });
  });
});
