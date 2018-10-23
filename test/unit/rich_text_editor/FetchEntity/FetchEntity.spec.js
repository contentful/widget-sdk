import React from 'react';
import { mount } from 'enzyme';

import FetchEntity from 'app/widgets/rich_text/plugins/shared/FetchEntity/FetchEntity.es6';
import RequestStatus from 'app/widgets/rich_text/plugins/shared/RequestStatus.es6';
import sinon from 'npm:sinon';
import flushPromises from '../../../helpers/flushPromises';

const sandbox = sinon.sandbox.create();

const newMockWidgetAPI = (entity, contentType) => {
  return {
    space: {
      getEntry: sandbox
        .stub()
        .withArgs(entity.sys.id)
        .returns(Promise.resolve(entity)),
      getContentType: sandbox
        .stub()
        .withArgs(contentType.sys.id)
        .returns(Promise.resolve(contentType))
    }
  };
};

describe('FetchEntity', () => {
  beforeEach(async function() {
    module('contentful/test');

    this.entity = {
      sys: {
        type: 'Entry',
        id: 'ENTRY-ID',
        contentType: {
          sys: {
            id: 'CT-ID'
          }
        }
      }
    };
    this.contentType = {
      sys: {
        id: 'CT-ID'
      },
      name: 'CONTENT-TYPE-NAME'
    };

    this.props = {
      entityId: this.entity.sys.id,
      entityType: 'Entry',
      localeCode: 'lo-LOCALE',
      render: sandbox.spy(() => null),
      widgetAPI: newMockWidgetAPI(this.entity, this.contentType),
      $services: {
        EntityState: {
          stateName: sandbox.stub().returns('draft'),
          getState: sandbox.stub()
        },
        EntityHelpers: {
          newForLocale: sandbox
            .stub()
            .withArgs('lo-LOCALE')
            .returns({
              entityFile: sandbox
                .stub()
                .withArgs(this.entity)
                .returns(Promise.resolve('FILE')),
              entityTitle: sandbox
                .stub()
                .withArgs(this.entity)
                .returns(Promise.resolve('TITLE')),
              entityDescription: sandbox
                .stub()
                .withArgs(this.entity)
                .returns(Promise.resolve('DESCRIPTION'))
            })
        }
      }
    };

    this.mount = function() {
      this.wrapper = mount(<FetchEntity {...this.props} />);
    };
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('(pending/error) props.render()', function() {
    beforeEach(function() {
      this.props.widgetAPI.space.getEntry.returns(Promise.reject(''));
      this.mount();
    });

    it('is called initially, while fetching entity', async function() {
      await flushPromises();
      expect(this.props.render.args[0][0]).toEqual({
        requestStatus: RequestStatus.Pending
      });
    });

    it('is called with `requestStatus: "error"`', async function() {
      await flushPromises();
      expect(this.props.render.args[1][0]).toEqual({
        requestStatus: RequestStatus.Error
      });
    });
  });

  describe('(pending/success) props.render()', function() {
    beforeEach(function() {
      this.mount();
    });

    it('is called initially, while fetching entity', async function() {
      await flushPromises();
      expect(this.props.render.args[0][0]).toEqual({
        requestStatus: RequestStatus.Pending
      });
    });

    it('is called after entity got fetched, while waiting for `entityFile`', async function() {
      await flushPromises();
      expect(this.props.render.args[1][0]).toEqual({
        entity: this.entity,
        contentTypeName: 'CONTENT-TYPE-NAME',
        entityTitle: 'TITLE',
        entityDescription: 'DESCRIPTION',
        entityStatus: 'draft',
        entityFile: undefined,
        requestStatus: RequestStatus.Pending
      });
    });

    it('is called with fetched entity and `entityFile`', async function() {
      await flushPromises();
      expect(this.props.render.args[2][0]).toEqual({
        entity: this.entity,
        contentTypeName: 'CONTENT-TYPE-NAME',
        entityTitle: 'TITLE',
        entityDescription: 'DESCRIPTION',
        entityStatus: 'draft',
        entityFile: 'FILE',
        requestStatus: RequestStatus.Success
      });
    });

    it('is called thrice in total', async function() {
      await flushPromises();
      sandbox.assert.callCount(this.props.render, 3);
    });
  });
});
