## How to use loading

### Inline loading

Use this pattern to load inline text context or other small elements on the page.
Please remember to use <Spinner> component at the end of the sentence. Forma36 <Spinner /> is an animated 3 dots, so it makes sense to use it at the end of the sentence.

Example of usage:

```jsx
import { Spinner } from '@contentful/forma-36-react-components';

<div data-test-id="view-loading" className={cn(styles.stateWrapper, styles.loadingWrapper)}>
  Loading <Spinner />
</div>;
```

### LoadingState component

It contains <Spinner /> in the primary color and generated random message. We recommend to use this component for loading bigger elements on the page, like cards

Example of usage:

```jsx
// SpaceCard.js
import { Spinner, Card } from '@contentful/forma-36-react-components';
import { LoadingState } from 'features/loading-state';

<Card testId="space-card">{loading && <LoadingState />}</Card>;
```

### Loading empty state

It injects loading in the full page size, recomended for loading page content.

Example of usage:

```jsx
// features/user-profile/components/UserProfilePage.tsx
import DocumentTitle from 'components/shared/DocumentTitle';
import { LoadingEmptyState } from 'features/loading-state';
import { Workbench } from '@contentful/forma-36-react-components';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';

<DocumentTitle title="User profile" />
<Workbench>
  <Workbench.Header
    title="User profile"
    icon={<ProductIcon icon="UserProfile" size="large" />}
  />
  <Workbench.Content className={styles.content}>
    {isLoading && <LoadingEmptyState testId="cf-ui-loading-state" />}
  </Workbench.Content>
</Workbench>
```

### LoadingOverlay

It injects loading in the full page size and covers all the elements with the overlay. We recommend to use it when there is a need to cover sidebar, for example.

Example of usage:

```jsx
//ReleaseDetailPage.js
import DocumentTitle from 'components/shared/DocumentTitle';
import { LoadingOverlay } from 'features/loading-state';
import { Workbench } from '@contentful/forma-36-react-components';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';

<div>
  {processingAction && <LoadingOverlay />}
  {hasError ? (
    <Note noteType="negative" className={styles.errorNote}>
      We are currently unable to display the details for this release due to a temporary system
      error.
    </Note>
  ) : (
    <Workbench>
      <DocumentTitle title={[title, 'Release']} />
      <Workbench.Header
        onBack={() => window.history.back()}
        title={title}
        icon={<Icon icon="Release" size="large" color="positive" />}
      />
    </Workbench>
  )}
</div>;
```
