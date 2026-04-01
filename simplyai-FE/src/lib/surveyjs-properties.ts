// Utility to register SurveyJS custom properties
import { Serializer } from 'survey-core';

let propertiesRegistered = false;

export function registerCustomProperties() {
  if (propertiesRegistered) return;
  
  console.log('Registering custom SurveyJS properties...');
  
  // Add 'guide' property to all questions
  if (!Serializer.findProperty('question', 'guide')) {
    Serializer.addProperty('question', {
      name: 'guide:text',
      displayName: 'Guide',
      category: 'Custom Properties',
      visibleIndex: 100,
      isRequired: false,
    });
    console.log('✅ Registered guide property');
  }

  // Add 'lesson' property to all questions
  if (!Serializer.findProperty('question', 'lesson')) {
    Serializer.addProperty('question', {
      name: 'lesson:text',
      displayName: 'Lesson',
      category: 'Custom Properties',
      visibleIndex: 101,
      isRequired: false,
    });
    console.log('✅ Registered lesson property');
  }

  // Add 'questionImage' property to all questions
  if (!Serializer.findProperty('question', 'questionImage')) {
    Serializer.addProperty('question', {
      name: 'questionImage:text',
      displayName: 'Question Image',
      category: 'Custom Properties',
      visibleIndex: 102,
      isRequired: false,
    });
    console.log('✅ Registered questionImage property');
  }

  // Add 'questionImageDescription' property for alt text
  if (!Serializer.findProperty('question', 'questionImageDescription')) {
    Serializer.addProperty('question', {
      name: 'questionImageDescription:text',
      displayName: 'Question Image Alt Text',
      category: 'Custom Properties',
      visibleIndex: 103,
      isRequired: false,
    });
    console.log('✅ Registered questionImageDescription property');
  }

  // Add score property to choices
  if (!Serializer.findProperty('itemvalue', 'score')) {
    Serializer.addProperty('itemvalue', {
      name: 'score:number',
      displayName: 'Score (Points)',
      category: 'general',
      visibleIndex: 3,
      minValue: 0,
      maxValue: 100,
      default: 0,
      isRequired: false,
    });
    console.log('✅ Registered score property for choices');
  }

  // Add showScores property to questions
  if (!Serializer.findProperty('question', 'showScores')) {
    Serializer.addProperty('question', {
      name: 'showScores:boolean',
      displayName: 'Show Answer Scores',
      category: 'Custom Properties',
      visibleIndex: 104,
      default: false,
    });
    console.log('✅ Registered showScores property');
  }

  propertiesRegistered = true;
  console.log('✅ All custom SurveyJS properties registered successfully');
}
