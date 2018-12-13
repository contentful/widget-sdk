import withWidgetApi from 'app/widgets/WidgetApi/index.es6';
import RichTextEditor from 'app/widgets/rich_text/RichTextEditor.es6';
import withFeatureFlag from 'app/widgets/rich_text/withFeatureFlag.es6';
import withTracking from 'app/widgets/rich_text/withTracking.es6';
import withPublicationWarning from 'app/widgets/rich_text/WithPublicationWarning/index.es6';

export default withFeatureFlag(withWidgetApi(withPublicationWarning(withTracking(RichTextEditor))));
