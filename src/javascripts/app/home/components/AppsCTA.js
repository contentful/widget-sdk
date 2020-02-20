import React from 'react';
import styles from '../styles';
import CTACardComponent from './CTACardComponent';
import ConnectWithAppIllustration from 'svg/connected-shapes.svg';
import { trackClickCTA } from '../tracking';

const AppsCTA = () => {
  return (
    <CTACardComponent
      heading="Connect your space with an app"
      description=" To add functionality and integrate with outside services, install a Contentful app."
      ctaLabel="Learn about Contentful apps"
      onClick={() => trackClickCTA('apps_documentation_link')}
      href={'https://www.contentful.com/developers/docs/extensibility/apps-framework'}
      illustration={<ConnectWithAppIllustration className={styles.svgContainerExtension} />}
      isExternal
    />
  );
};

export default AppsCTA;
