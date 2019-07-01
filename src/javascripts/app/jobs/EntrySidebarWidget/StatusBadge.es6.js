import React from 'react';
import PropTypes from 'prop-types';

export default function StatusBadge({ status }) {
  return (
    <div className="entity-sidebar__state">
      <span
        className="entity-sidebar__state-indicator"
        data-state={status}
        data-test-id="entity-state"
      />
      <strong>Status: </strong>
      {status === 'archived' && <span>Archived</span>}
      {status === 'draft' && <span>Draft</span>}
      {status === 'published' && <span>Published</span>}
      {status === 'changes' && <span>Published (pending changes)</span>}
    </div>
  );
}

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired
};
