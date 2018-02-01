import _ from 'lodash';
import { createElement as h } from 'libs/react';
import { mount } from 'libs/enzyme';
import sinon from 'npm:sinon';
import { createIsolatedSystem } from 'test/helpers/system-js';
import { EntityType } from 'app/entity_editor/Components/constants';

import { flushPromises } from './helpers';

describe('FetchLinksToEntity', function () {
  const defaultProps = {
    id: 'entry-id',
    type: EntityType.ENTRY
  };

  function* importModule ({ fetchLinksStub }) {
    const system = createIsolatedSystem();
    system.set('app/entity_editor/Components/FetchLinksToEntity/fetchLinks', {
      default: fetchLinksStub
    });

    const { default: FetchLinksToEntity } = yield system.import(
      'app/entity_editor/Components/FetchLinksToEntity'
    );

    return FetchLinksToEntity;
  }

  function render (Component, props) {
    return mount(h(Component, _.extend({}, defaultProps, props)));
  }

  it('passes pending state on initial render', function* () {
    const fetchLinksStub = sinon.stub().returns(Promise.resolve());
    const Component = yield* importModule({ fetchLinksStub });

    const renderFunc = sinon.stub().returns(null);
    render(Component, { render: renderFunc });

    sinon.assert.calledWith(renderFunc, { links: [], requestState: 'pending' });
  });

  it('passes success state and links if api called returns data', function* () {
    const links = [{ a: 1 }, { b: 2 }];
    const fetchLinksStub = sinon
      .stub()
      .withArgs(defaultProps.id, defaultProps.type)
      .returns(Promise.resolve(links));

    const Component = yield* importModule({ fetchLinksStub });

    const renderFunc = sinon.stub().returns(null);
    render(Component, { render: renderFunc });
    yield flushPromises();

    sinon.assert.calledWith(renderFunc.getCall(1), {
      links,
      requestState: 'success'
    });
  });

  it('passes error state and empty links if api fails to return data', function* () {
    const fetchLinksStub = sinon
      .stub()
      .withArgs(defaultProps.id, defaultProps.type)
      .returns(Promise.reject(new Error()));
    const Component = yield* importModule({ fetchLinksStub });

    const renderFunc = sinon.stub().returns(null);
    render(Component, { render: renderFunc });
    yield flushPromises();

    sinon.assert.calledWith(renderFunc.getCall(1), {
      links: [],
      requestState: 'error'
    });
  });
});
