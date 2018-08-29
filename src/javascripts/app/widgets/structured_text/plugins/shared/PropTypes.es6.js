import PropTypes from 'prop-types';

export const MarkPropTypes = {
  attributes: PropTypes.object.isRequired,
  children: PropTypes.node.isRequired,
  mark: PropTypes.string.isRequired
};

export const NodePropTypes = {
  attributes: PropTypes.object.isRequired,
  children: PropTypes.node.isRequired,
  type: PropTypes.string.isRequired
};

export const ToolbarIconPropTypes = {
  change: PropTypes.object.isRequired,
  onToggle: PropTypes.func.isRequired,
  disabled: PropTypes.bool.isRequired
};
