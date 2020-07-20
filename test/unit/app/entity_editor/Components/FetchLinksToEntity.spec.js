import React from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import { EntityType } from 'app/entity_editor/Components/constants';

import flushPromises from 'test/utils/flushPromises';

describe('FetchLinksToEntity', () => {
  const defaultProps = {
    id: 'entry-id',
    type: EntityType.ENTRY,
    origin: 'sidebar',
  };

  beforeEach(function () {
    this.onFetchLinks = sinon.stub();
    this.system.set('analytics/events/IncomingLinks', {
      onFetchLinks: this.onFetchLinks,
      Origin: {
        DIALOG: 'dialog',
        SIDEBAR: 'sidebar',
      },
    });

    const system = this.system;

    this.importModule = async function ({ fetchLinksStub }) {
      system.set('app/entity_editor/Components/FetchLinksToEntity/fetchLinks', {
        default: fetchLinksStub,
      });

      const { default: FetchLinksToEntity } = await system.import(
        'app/entity_editor/Components/FetchLinksToEntity'
      );

      return FetchLinksToEntity;
    };
  });

  function render(Component, props) {
    return mount(<Component {...defaultProps} {...props} />);
  }

  it('passes pending state on initial render', async function () {
    const fetchLinksStub = sinon.stub().returns(Promise.resolve([]));
    const Component = await this.importModule({ fetchLinksStub });

    const renderFunc = sinon.stub().returns(null);
    render(Component, { render: renderFunc });

    sinon.assert.calledWith(renderFunc, { links: [], requestState: 'pending' });
  });

  it('passes success state and links if api called returns data', async function () {
    const links = [{ id: 1 }, { id: 2 }];
    const fetchLinksStub = sinon
      .stub()
      .withArgs(defaultProps.id, defaultProps.type)
      .returns(Promise.resolve(links));

    const Component = await this.importModule({ fetchLinksStub });

    const renderFunc = sinon.stub().returns(null);
    render(Component, { render: renderFunc });
    await flushPromises();

    sinon.assert.calledWith(renderFunc.getCall(1), {
      links,
      requestState: 'success',
    });
    sinon.assert.calledWithExactly(this.onFetchLinks, {
      entityId: 'entry-id',
      entityType: EntityType.ENTRY,
      incomingLinkIds: [1, 2],
    });
  });

  it('passes error state and empty links if api fails to return data', async function () {
    const fetchLinksStub = sinon
      .stub()
      .withArgs(defaultProps.id, defaultProps.type)
      .returns(Promise.reject(new Error()));

    const Component = await this.importModule({ fetchLinksStub });

    const renderFunc = sinon.stub().returns(null);
    render(Component, { render: renderFunc });
    await flushPromises();

    sinon.assert.calledWith(renderFunc.getCall(1), {
      links: [],
      requestState: 'error',
    });
  });
});
