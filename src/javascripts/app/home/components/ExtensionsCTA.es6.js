import React from 'react';
import styles from '../styles.es6';
import CTACardComponent from './CTACardComponent.es6';
import ConnectWithExtensionIllustration from 'svg/connected-shapes.es6';
import { trackClickCTA } from '../tracking.es6';

const ExtensionsCTA = () => {
  return (
    <CTACardComponent
      heading="Connect your space with a UI extension"
      description=" To add functionality and integrate with outside services, add a UI extension."
      ctaLabel="Learn about UI extensions"
      onClick={() => trackClickCTA('extensions_documentation_link')}
      href={'https://www.contentful.com/developers/docs/extensibility/ui-extensions/'}
      illustration={<ConnectWithExtensionIllustration className={styles.svgContainerExtension} />}
      isExternal
    />
  );
};

export default ExtensionsCTA;
