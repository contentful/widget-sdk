import React, { useState } from 'react';
import PropTypes from 'prop-types';
import WidgetContainer from './widgets/WidgetContainer';
import GreetingWidget from './widgets/GreetingWidget';
import ConceptVideoWidget from './widgets/ConceptVideoWidget';
import WalkthroughWidget from './widgets/walkthrough/WalkthroughWidget';

const AuthorEditorSpaceHome = ({ spaceName, orgName }) => {
  const [walkthroughStarted, setWalkthroughState] = useState(false);
  return (
    <WidgetContainer>
      <WidgetContainer.Row>
        <GreetingWidget
          spaceName={spaceName}
          orgName={orgName}
          walkthroughStarted={walkthroughStarted}
        />
      </WidgetContainer.Row>
      <WidgetContainer.Row order={walkthroughStarted && '3'}>
        <WalkthroughWidget spaceName={spaceName} setWalkthroughState={setWalkthroughState} />
      </WidgetContainer.Row>
      <WidgetContainer.Row>
        <ConceptVideoWidget />
      </WidgetContainer.Row>
    </WidgetContainer>
  );
};

AuthorEditorSpaceHome.propTypes = {
  spaceName: PropTypes.string,
  orgName: PropTypes.string
};

export default AuthorEditorSpaceHome;
