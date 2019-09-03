import React, { useState } from 'react';
import PropTypes from 'prop-types';
import WidgetContainer from './widgets/WidgetContainer.es6';
import GreetingWidget from './widgets/GreetingWidget.es6';
import ConceptVideoWidget from './widgets/ConceptVideoWidget.es6';
import WalkthroughWidget from './widgets/walkthrough/WalkthroughWidget.es6';

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
