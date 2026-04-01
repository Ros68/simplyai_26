# Questionnaire Import Feature

This feature allows you to import questionnaires from text files (TXT) or CSV files into the Form Builder.

## Supported File Formats

### 1. Text File (.txt)
Questions are formatted with specific prefixes:

```
1. What is your name?
D: Please enter your full name
T: text
R: yes

2. What is your favorite color?
T: radiogroup
- Red
- Blue
- Green
- Yellow

3. Tell us about yourself
D: Please provide some information about yourself
T: comment
L: This is a lesson about self-reflection
G: Take your time to think about your answer
```

#### Format Rules:
- **Question Title**: Start with number (1., 2.) or Q:
- **Description (D:)**: Optional description for the question
- **Type (T:)**: Question type (text, radiogroup, checkbox, comment, dropdown, rating, boolean, number)
- **Required (R:)**: yes/no to mark question as required
- **Choices**: Start with - or * for multiple choice options
- **Lesson (L:)**: Optional lesson text that appears in the sidebar
- **Guide (G:)**: Optional guide text that appears in a popup

### 2. CSV File (.csv)
Questions are formatted in a table structure:

```csv
title,type,choices,description,lesson,guide,required
"What is your name?",text,,Please enter your full name,,,yes
"What is your favorite color?",radiogroup,"Red|Blue|Green|Yellow",,,,no
"Tell us about yourself",comment,,Please provide some information,This is a lesson about self-reflection,Take your time to think about your answer,no
```

#### CSV Columns:
- **title**: Question text
- **type**: Question type
- **choices**: Multiple choices separated by | (pipe)
- **description**: Question description
- **lesson**: Lesson text for sidebar
- **guide**: Guide text for popup
- **required**: yes/no for required questions

## Supported Question Types

1. **text**: Single line text input
2. **comment**: Multi-line text area
3. **number**: Numeric input
4. **radiogroup**: Single choice from multiple options
5. **checkbox**: Multiple choice selection
6. **dropdown**: Dropdown selection
7. **rating**: Rating scale
8. **boolean**: Yes/No question

## How to Use

1. Navigate to the Form Builder page
2. Click the "Import Form" button
3. Choose your import method:
   - **Upload File**: Select a TXT or CSV file
   - **Paste Text**: Paste your questions directly
4. Select the file format (TXT or CSV)
5. Enter a form title and optional description
6. Preview your questions before importing
7. Click "Import Form" to create the questionnaire

## Template Files

Download sample templates to understand the format:
- [TXT Template](/templates/questionnaire-template.txt)
- [CSV Template](/templates/questionnaire-template.csv)

## Features

- **Preview Mode**: Review parsed questions before importing
- **Auto-detection**: Automatically detects question types and properties
- **Validation**: Ensures required fields are provided
- **Error Handling**: Clear error messages for invalid formats
- **Template Downloads**: Sample files to help users understand the format

## Import Process

1. **File Parsing**: The system reads and parses the file content
2. **Question Extraction**: Extracts questions, types, choices, and metadata
3. **Validation**: Validates question structure and required fields
4. **SurveyJS Conversion**: Converts to SurveyJS format
5. **Database Storage**: Saves the form to the database
6. **Success Notification**: Shows confirmation with question count

## Error Handling

The import system handles various error scenarios:
- Invalid file format
- Missing required fields
- Malformed question structure
- File reading errors
- Database connection issues

## Best Practices

1. **Use Templates**: Start with the provided templates
2. **Test Small Files**: Import small files first to test the format
3. **Backup Data**: Keep backups of your original files
4. **Validate Content**: Review the preview before importing
5. **Consistent Formatting**: Follow the format rules consistently

## Troubleshooting

### Common Issues:

1. **Questions not importing**: Check the format and ensure proper prefixes
2. **Choices not appearing**: Verify choice format (start with - or * for TXT, separate with | for CSV)
3. **Type not recognized**: Use supported question types only
4. **File encoding**: Ensure files are saved in UTF-8 encoding

### Getting Help:

- Download and examine the template files
- Check the format instructions in the import dialog
- Review the preview before importing
- Contact support if issues persist 