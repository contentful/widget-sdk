import React from 'react';
import styles from '../styles';
import CTACardComponent from './CTACardComponent';
import ConnectWithExtensionIllustration from 'svg/connected-shapes.svg';
import { trackClickCTA } from '../tracking';

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
