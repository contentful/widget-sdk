import withWidgetApi from 'app/widgets/WidgetApi/index.es6';
import RichTextEditor from 'app/widgets/rich_text/RichTextEditor.es6';
import withTracking from 'app/widgets/rich_text/withTracking.es6';
import withPublicationWarning from 'app/widgets/rich_text/WithPublicationWarning/index.es6';

export default withWidgetApi(withPublicationWarning(withTracking(RichTextEditor)), {
  updateValueOnComponentChange: false,
  // TODO: We should get rid of this behavior and update RT also
  //  while in enabled state if there are any updates by other
  //  users or via API. Currently this would break list related
  //  unit tests so we had to look into this.
  updateValueWhileEnabled: false
});
