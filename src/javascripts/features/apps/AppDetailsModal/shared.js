import PropTypes from 'prop-types';

export const AppPropType = PropTypes.shape({
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  appInstallation: PropTypes.object,
  links: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      url: PropTypes.string.isRequired,
    }).isRequired
  ),
  author: PropTypes.shape({
    name: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
    icon: PropTypes.node.isRequired,
  }).isRequired,
  icon: PropTypes.string.isRequired,
  categories: PropTypes.arrayOf(PropTypes.string.isRequired),
  supportUrl: PropTypes.string,
});

export const externalLinkProps = {
  target: '_blank',
  rel: 'noopener noreferrer',
};
