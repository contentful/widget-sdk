import React, { useEffect, useReducer } from 'react';
import SidebarEventTypes from '../SidebarEventTypes.es6';
import CommentsPanel from './CommentsPanel.es6';

const INIT = 'INIT';
const CHANGE_VISIBILITY = 'CHANGE_VISIBILITY';

const reducer = (state, action) => {
  switch (action.type) {
    case INIT:
      return { ...action.data, initialized: true };
    case CHANGE_VISIBILITY:
      return { ...state, isVisible: action.data.isVisible };
  }
};

/**
 * This component is the bridge between the EntitySidebar and the CommentPanel components.
 * It receives spaceId, entityId and environmentId via an event.
 * The CommentPanel component is only rendered after this data is available
 * This component also takes care of listening to an event to decide when
 * to show or hide the comments panel.
 */

export default function CommentsPanelContainer({ emitter }) {
  const [state, dispatch] = useReducer(reducer, { initialized: false });

  useEffect(() => {
    emitter.on(SidebarEventTypes.INIT_COMMENTS_PANEL, ({ entryId, environmentId, spaceId }) => {
      dispatch({ type: INIT, data: { entryId, environmentId, spaceId } });
    });
    emitter.on(SidebarEventTypes.UPDATED_COMMENTS_PANEL, ({ isVisible }) => {
      dispatch({ type: CHANGE_VISIBILITY, data: { isVisible } });
    });

    return () => {
      emitter.off(SidebarEventTypes.INIT_COMMENTS_PANEL);
      emitter.off(SidebarEventTypes.UPDATED_COMMENTS_PANEL);
    };
  }, [emitter]);

  const { initialized, ...panelProps } = state;

  return initialized && <CommentsPanel {...panelProps} />;
}
