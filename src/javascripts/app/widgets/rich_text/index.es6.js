import withWidgetApi from 'app/widgets/WidgetApi/index.es6';
import RichTextEditor from 'app/widgets/rich_text/RichTextEditor.es6';
import withTracking from 'app/widgets/rich_text/withTracking.es6';
import withPublicationWarning from 'app/widgets/rich_text/WithPublicationWarning/index.es6';

export default withWidgetApi(withPublicationWarning(withTracking(RichTextEditor)));
