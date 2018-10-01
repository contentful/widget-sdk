import React from 'react';
import { mount } from 'enzyme';

import FetchEntity from 'app/widgets/structured_text/plugins/shared/FetchEntity/FetchEntity.es6';
import RequestStatus from 'app/widgets/structured_text/plugins/shared/RequestStatus.es6';
import sinon from 'npm:sinon';
import { flushPromises } from '../helpers';

const newMockWidgetAPI = (entity, contentType) => {
  return {
    space: {
      getEntry: sinon
        .stub()
        .withArgs(entity.sys.id)
        .resolves(entity),
      getContentType: sinon
        .stub()
        .withArgs(contentType.sys.id)
        .resolves(contentType)
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
      render: sinon.spy(() => null),
      widgetAPI: newMockWidgetAPI(this.entity, this.contentType),
      $services: {
        EntityHelpers: {
          newForLocale: sinon
            .stub()
            .withArgs('lo-LOCALE')
            .returns({
              entityFile: sinon
                .stub()
                .withArgs(this.entity)
                .resolves('FILE'),
              entityTitle: sinon
                .stub()
                .withArgs(this.entity)
                .resolves('TITLE'),
              entityDescription: sinon
                .stub()
                .withArgs(this.entity)
                .resolves('DESCRIPTION')
            })
        }
      }
    };

    this.mount = function() {
      this.wrapper = mount(<FetchEntity {...this.props} />);
    };
  });

  describe('(pending/error) props.render()', function() {
    beforeEach(function() {
      this.props.widgetAPI.space.getEntry.rejects();
      this.mount();
    });

    it('is called initially, while fetching entity', function() {
      sinon.assert.calledOnceWith(this.props.render, {
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

    it('is called initially, while fetching entity', function() {
      sinon.assert.calledOnceWith(this.props.render, {
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
      sinon.assert.callCount(this.props.render, 3);
    });
  });
});
