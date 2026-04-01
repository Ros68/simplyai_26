import React, { useRef } from 'react';
import { SurveyCreatorComponent, SurveyCreator } from 'survey-creator-react';
import 'survey-creator-core/survey-creator-core.css';
import 'survey-core/survey-core.css';

export default function FormBuilderTestStandalone() {
  const creatorRef = useRef<SurveyCreator | null>(null);

  if (!creatorRef.current) {
    creatorRef.current = new SurveyCreator({
      showToolbox: true,
      showLogicTab: true,
      showThemeTab: true,
      showTestSurveyTab: true,
      showJSONEditorTab: true,
    });
  }

  return (
    <div style={{ height: '100vh' }}>
      <SurveyCreatorComponent creator={creatorRef.current} />
    </div>
  );
} 