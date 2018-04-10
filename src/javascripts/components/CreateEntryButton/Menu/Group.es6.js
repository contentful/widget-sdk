import _ from 'lodash';
import * as React from 'react';
import PropTypes from 'prop-types';

export default function Group ({ title, testId = 'group', children }) {
  return (
    <div>
      <div className="context-menu__header" data-test-id={testId}>
        {title}
      </div>
      <ul>{children}</ul>
    </div>
  );
}

Group.propTypes = {
  title: PropTypes.string,
  testId: PropTypes.string,
  children: PropTypes.node
};
