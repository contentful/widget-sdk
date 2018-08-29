import _ from 'lodash';
import { createElement as h } from 'react';
import { mount } from 'enzyme';
import sinon from 'npm:sinon';
import { createIsolatedSystem } from 'test/helpers/system-js';
import { EntityType } from 'app/entity_editor/Components/constants';

import { flushPromises } from './helpers';

describe('FetchLinksToEntity', () => {
  const defaultProps = {
    id: 'entry-id',
    type: EntityType.ENTRY,
    origin: 'sidebar'
  };

  beforeEach(function() {
    this.onFetchLinks = sinon.stub();
    const system = createIsolatedSystem();
    system.set('analytics/events/IncomingLinks', {
      onFetchLinks: this.onFetchLinks,
      Origin: {
        DIALOG: 'dialog',
        SIDEBAR: 'sidebar'
      }
    });
    this.system = system;
    this.importModule = function*({ fetchLinksStub }) {
      system.set('app/entity_editor/Components/FetchLinksToEntity/fetchLinks', {
        default: fetchLinksStub
      });

      const { default: FetchLinksToEntity } = yield system.import(
        'app/entity_editor/Components/FetchLinksToEntity'
      );

      return FetchLinksToEntity;
    };
  });

  afterEach(function() {
    delete this.system;
  });

  function render(Component, props) {
    return mount(h(Component, _.extend({}, defaultProps, props)));
  }

  it('passes pending state on initial render', function*() {
    const fetchLinksStub = sinon.stub().returns(Promise.resolve([]));
    const Component = yield* this.importModule({ fetchLinksStub });

    const renderFunc = sinon.stub().returns(null);
    render(Component, { render: renderFunc });

    sinon.assert.calledWith(renderFunc, { links: [], requestState: 'pending' });
  });

  it('passes success state and links if api called returns data', function*() {
    const links = [{ a: 1 }, { b: 2 }];
    const fetchLinksStub = sinon
      .stub()
      .withArgs(defaultProps.id, defaultProps.type)
      .returns(Promise.resolve(links));

    const Component = yield* this.importModule({ fetchLinksStub });

    const renderFunc = sinon.stub().returns(null);
    render(Component, { render: renderFunc });
    yield flushPromises();

    sinon.assert.calledWith(renderFunc.getCall(1), {
      links,
      requestState: 'success'
    });
    sinon.assert.calledWithExactly(this.onFetchLinks, {
      entityId: 'entry-id',
      entityType: EntityType.ENTRY,
      incomingLinksCount: 2
    });
  });

  it('passes error state and empty links if api fails to return data', function*() {
    const fetchLinksStub = sinon
      .stub()
      .withArgs(defaultProps.id, defaultProps.type)
      .returns(Promise.reject(new Error()));

    const Component = yield* this.importModule({ fetchLinksStub });

    const renderFunc = sinon.stub().returns(null);
    render(Component, { render: renderFunc });
    yield flushPromises();

    sinon.assert.calledWith(renderFunc.getCall(1), {
      links: [],
      requestState: 'error'
    });
  });
});
