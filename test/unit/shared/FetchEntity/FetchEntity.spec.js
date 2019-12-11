import sinon from 'sinon';
import flushPromises from 'test/utils/flushPromises';
import React from 'react';
import { mount } from 'enzyme';
import { $initialize } from 'test/utils/ng';
import { it } from 'test/utils/dsl';

const sandbox = sinon.sandbox.create();

const newMockWidgetAPI = (entity, contentType) => {
  return {
    jobs: {
      getPendingJobs: sandbox.stub().returns(Promise.resolve([]))
    },
    space: {
      getEntry: sandbox
        .stub()
        .withArgs(entity.sys.id)
        .returns(Promise.resolve(entity)),
      getContentType: sandbox
        .stub()
        .withArgs(contentType.sys.id)
        .returns(Promise.resolve(contentType))
    },
    currentUrl: {
      pathname: ''
    }
  };
};

describe('FetchEntity', () => {
  let FetchEntity;
  let RequestStatus;

  beforeEach(async function() {
    this.system.set('data/CMA/EntityState', {
      stateName: sinon.stub().returns('draft'),
      getState: sinon.stub()
    });

    this.system.set('app/entity_editor/entityHelpers', {
      newForLocale: sinon
        .stub()
        .withArgs('lo-LOCALE')
        .returns({
          entityFile: sinon
            .stub()
            .withArgs(this.entity)
            .returns(Promise.resolve('FILE')),
          entityTitle: sinon
            .stub()
            .withArgs(this.entity)
            .returns(Promise.resolve('TITLE')),
          entityDescription: sinon
            .stub()
            .withArgs(this.entity)
            .returns(Promise.resolve('DESCRIPTION'))
        })
    });

    const FetchEntityModule = await this.system.import('app/widgets/shared/FetchEntity');
    FetchEntity = FetchEntityModule.default;
    RequestStatus = FetchEntityModule.RequestStatus;

    await $initialize(this.system);

    this.entity = {
      sys: {
        type: 'Entry',
        id: 'ENTRY-ID',
        contentType: {
          sys: {
            id: 'CT-ID'
          }
        },
        environment: {
          sys: { id: 'envId' }
        },
        space: {
          sys: { id: 'spaceId' }
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
      widgetAPI: newMockWidgetAPI(this.entity, this.contentType)
    };

    this.mount = function(props = {}) {
      this.wrapper = mount(<FetchEntity {...this.props} {...props} />);
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

    it('is called initially, while fetching entity', function() {
      expect(this.props.render.args[0][0]).toEqual({
        requestStatus: RequestStatus.Pending
      });
    });

    it('is called with `requestStatus: "error"`', function() {
      expect(this.props.render.args[1][0]).toEqual({
        requestStatus: RequestStatus.Error
      });
    });
  });

  const EXPECTED_RENDER_CALLS = 3;

  describe('(pending/success) props.render()', function() {
    beforeEach(async function() {
      this.mount();
      await flushPromises();
    });

    it('is called initially, while fetching entity', function() {
      expect(this.props.render.args[0][0]).toEqual({
        requestStatus: RequestStatus.Pending
      });
    });

    it('is called after entity got fetched, while waiting for `entityFile`', function() {
      expect(this.props.render.args[1][0]).toEqual({
        entity: this.entity,
        contentTypeName: 'CONTENT-TYPE-NAME',
        entityTitle: 'TITLE',
        entityDescription: 'DESCRIPTION',
        entityStatus: 'draft',
        statusIcon: '',
        entityFile: undefined,
        requestStatus: RequestStatus.Pending
      });
    });

    it('is called with fetched entity and `entityFile`', function() {
      expect(this.props.render.args[2][0]).toEqual({
        entity: this.entity,
        contentTypeName: 'CONTENT-TYPE-NAME',
        entityTitle: 'TITLE',
        entityDescription: 'DESCRIPTION',
        entityStatus: 'draft',
        statusIcon: '',
        entityFile: 'FILE',
        requestStatus: RequestStatus.Success
      });
    });

    it('is called thrice in total (before fetch, fetch entry, fetch file)', function() {
      sandbox.assert.callCount(this.props.render, EXPECTED_RENDER_CALLS);
    });
  });

  describe('on navigation (widgetAPI.currentUrl', function() {
    beforeEach(async function() {
      const updateUrl = pathname =>
        (this.props.widgetAPI = { ...this.props.widgetAPI, currentUrl: { pathname } });
      updateUrl(`base/${this.entity.sys.id}`);
      this.mount();
      await flushPromises();
      this.props.render.reset();
      updateUrl(`base/other`);
      this.wrapper.setProps(this.props);
      await flushPromises();
    });

    it('updates and re-fetches all information', function() {
      sandbox.assert.callCount(this.props.render, EXPECTED_RENDER_CALLS);
    });

    it('does not reset `entityFile` while waiting for it`s updated version', function() {
      sinon.assert.alwaysCalledWith(this.props.render, sinon.match({ entityFile: 'FILE' }));
    });
  });

  it('does not fetch `entityFile` if props.fetchFile=false', async function() {
    this.mount({ fetchFile: false });
    await flushPromises();
    sandbox.assert.callCount(this.props.render, EXPECTED_RENDER_CALLS - 1);
    sinon.assert.alwaysCalledWith(this.props.render, sinon.match({ entityFile: undefined }));
  });
});
