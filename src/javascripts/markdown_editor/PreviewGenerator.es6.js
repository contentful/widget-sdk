import * as K from 'utils/kefir';
import LazyLoader from 'LazyLoader';
import {caseof} from 'libs/sum-types';
import makePreviewRender from './PreviewRender';

/**
 * Given a property containing the markdown source return a property
 * that contains the preview information. This information is used by
 * the `cfMarkdownPreview` directive.
 *
 * The preview information object is either of the shape `{error:
 * boolean}` or `{preview: object?}`.
 *
 * The value `{error: true}` indicates that either the libraries failed
 * to load or the preview function crashed.
 *
 * The value `{preview: null}` indicates that the library have not been
 * loaded yet.
 *
 * Otherwise, the `preview` object has the following properties.
 * - `value`  The MD source
 * - `tree` React element containing the VDom preview
 * - `info.chars` The number of charaters on `value`
 * - `info.words` The number of words in the MD source text
 *
 * @param {K.Property<string?>} markdown$
 * @returns {K.Property<PreviewData>}
 */
export default function (markdown$) {
  const previewRenderPromise =
    LazyLoader.get('markdown')
    .then(makePreviewRender);

  const markdownThrottled$ =
    markdown$
    .throttle(250)
    .map((src) => src || '')
    .skipDuplicates();

  const preview$ =
    K.promiseProperty(previewRenderPromise)
    .flatMapLatest((promise) => caseof(promise, [
      // Libs still loading: No preview avilable
      [K.PromiseStatus.Pending, () => K.constant({preview: null})],
      // Loading libs failed: Emit error
      [K.PromiseStatus.Rejected, () => K.constant({error: true})],
      // previewRender is available: Create new stream that applies it
      // to src$.
      [K.PromiseStatus.Resolved, ({value}) => makePreview$(value)]
    ]));


  // Given the loaded preview renderer we construct a stream that
  // applies it to the markdown source.
  function makePreview$ (previewRender) {
    return markdownThrottled$.map((markdown) => {
      try {
        const tree = previewRender(markdown);
        return {
          preview: {
            value: markdown,
            tree: tree.root,
            info: {
              chars: markdown.length,
              words: tree.words
            }
          }
        };
      } catch (_e) {
        return {error: true};
      }
    });
  }

  return preview$;
}
