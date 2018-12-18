import PropTypes from 'prop-types';

export const FieldType = PropTypes.shape({
  id: PropTypes.string.isRequired,
  helper: PropTypes.string.isRequired,
  helperParameter: PropTypes.string.isRequired,
  transformPath: PropTypes.string
});

export const RecordType = PropTypes.shape({
  isNewRecord: PropTypes.bool,
  configIndex: PropTypes.number,
  created: PropTypes.bool,
  updated: PropTypes.bool,
  deleted: PropTypes.bool,
  index: PropTypes.string.isRequired,
  localeCode: PropTypes.string.isRequired,
  contentTypeId: PropTypes.string.isRequired,
  publishWebhookId: PropTypes.string,
  unpublishWebhookId: PropTypes.string,
  fields: PropTypes.shape({
    default: PropTypes.bool,
    custom: PropTypes.arrayOf(FieldType)
  }).isRequired
});
