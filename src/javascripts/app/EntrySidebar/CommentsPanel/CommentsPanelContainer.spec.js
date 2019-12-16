import React from 'react';
import { shallow } from 'enzyme';
import mitt from 'mitt';

import SidebarEventTypes from '../SidebarEventTypes';
import CommentsPanelContainer from './CommentsPanelContainer';

// TODO: find a better way to avoid the ng dependencies
jest.mock('services/TokenStore', () => {});
jest.mock('access_control/OrganizationMembershipRepository', () => {});

describe('CommentsPanelContainer', () => {
  let emitter;
  let off;
  let component;
  const params = {
    endpoint: () => {},
    entryId: 'my-entry',
    environmentId: 'my-env'
  };
  const render = () => {
    emitter = mitt();
    off = jest.spyOn(emitter, 'off');
    return shallow(<CommentsPanelContainer emitter={emitter} isVisible />);
  };

  beforeEach(() => {
    component = render();
    emitter.emit(SidebarEventTypes.INIT_COMMENTS_PANEL, params);
  });

  it('initializes the sidebar', () => {
    expect(component).toMatchSnapshot();
  });

  it('makes panel visible', () => {
    emitter.emit(SidebarEventTypes.UPDATED_COMMENTS_PANEL, { isVisible: true });
    component.update();
    expect(component).toMatchSnapshot();
  });

  it('makes panel hidden', () => {
    emitter.emit(SidebarEventTypes.UPDATED_COMMENTS_PANEL, { isVisible: false });
    component.update();
    expect(component).toMatchSnapshot();
  });

  it('unsubcribes from events', () => {
    const component = render();
    component.unmount();
    expect(off).toHaveBeenNthCalledWith(1, SidebarEventTypes.INIT_COMMENTS_PANEL);
    expect(off).toHaveBeenNthCalledWith(2, SidebarEventTypes.UPDATED_COMMENTS_PANEL);
  });
});
