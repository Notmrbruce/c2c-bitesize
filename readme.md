# C2C Bitesize Learning Platform

A modular web-based learning platform for C2C training materials with multiple interactive learning methods.

## Project Structure

```
c2c-bitesize/
├── index.html             # Main application shell
├── css/
│   └── styles.css         # Extracted styles  
├── js/
│   ├── app.js             # Core application logic
│   ├── module-loader.js   # Handles fetching module data
├── data/
    └── modules/
        ├── index.json     # List of all available modules
        ├── policies.json  # Each module in separate file
        ├── medical.json
        └── etc...
```

## Features

- **Flashcards**: Flip through digital cards to test your recall of key information.
- **Quiz**: Test your knowledge with multiple-choice questions and get immediate feedback.
- **Time Trial**: Race against the clock to match terms with their definitions.
- **True & False**: Determine whether statements are true or false to test your understanding.
- **Progress Tracking**: See your position in each learning method and track your scores.
- **Method Descriptions**: Get a brief explanation of each learning method before you start.

## How to Add New Modules

1. Create a new JSON file in the `data/modules/` directory with the module's ID as the filename (e.g., `fire-safety.json`)
2. Add the module's metadata to `data/modules/index.json`
3. Fill in the module content following the standard format

### Module Format

```json
{
  "id": "module-id",
  "title": "Module Title",
  "description": "Brief description of the module content",
  "methods": ["flashcards", "quiz", "time-trial", "true-false"],
  "content": {
    "flashcards": [
      {
        "question": "Question text?",
        "answer": "Answer text."
      },
      // More flashcards...
    ],
    "quiz": [
      {
        "question": "Quiz question?",
        "options": [
          "Option 1",
          "Option 2",
          "Option 3",
          "Option 4"
        ],
        "correctAnswer": 1  // Index of correct answer (0-based)
      },
      // More quiz questions...
    ],
    "time-trial": [
      { "term": "Term", "definition": "Definition" },
      // More term-definition pairs...
    ],
    "true-false": [
      {
        "statement": "This is a true statement.",
        "isTrue": true,
        "explanation": "Explanation of why the statement is true."
      },
      {
        "statement": "This is a false statement.",
        "isTrue": false,
        "explanation": "Explanation of why the statement is false."
      },
      // More true/false statements...
    ]
  }
}
```

## How to Update Existing Modules

1. Locate the module's JSON file in `data/modules/`
2. Edit the file to update content
3. Save the file and reload the application

## Adding New Learning Methods

To add a new learning method to a module:

1. Add the method name to the `methods` array (e.g., `"methods": ["flashcards", "quiz", "time-trial", "true-false", "your-new-method"]`)
2. Add the corresponding content under the `content` object
3. Implement the method in app.js and add appropriate styling in styles.css

## Working with GitHub

### Adding a New Module

1. Clone the repository
2. Create a new branch: `git checkout -b add-new-module`
3. Create the module JSON file
4. Add the module to the index.json file
5. Commit changes: `git commit -m "Add new module: [module name]"`
6. Push to GitHub: `git push origin add-new-module`
7. Create a Pull Request

### Updating a Module

1. Clone the repository
2. Create a new branch: `git checkout -b update-module-name`
3. Make your changes to the module JSON file
4. Commit changes: `git commit -m "Update module: [what changed]"`
5. Push to GitHub: `git push origin update-module-name`
6. Create a Pull Request

## Deployment

This application can be deployed to any static web hosting service:

1. GitHub Pages
2. Netlify
3. Vercel
4. Any standard web server

Simply upload all files maintaining the directory structure.

## Running Locally

1. Clone the repository
2. Start a local web server:
   - Python: `python -m http.server`
   - Node.js: `npx serve`
   - PHP: `php -S localhost:8000`
3. Open `http://localhost:8000` in your browser

## Content Guidelines

When creating module content:

1. Keep questions clear and concise
2. Provide comprehensive answers
3. For quizzes, make sure the correct answer is clearly defined
4. For time trial, keep terms and definitions reasonably short
5. For true/false, include explanations that help reinforce learning
6. Include 10-15 items per learning method for optimal learning experience

## Learning Methods Guide

### Flashcards
- Front: Clear, concise question
- Back: Comprehensive answer
- Best for: Key facts, definitions, procedures

### Quiz
- Multiple choice questions with 4 options
- One correct answer per question
- Best for: Testing recall and application of knowledge

### Time Trial
- Term and definition pairs
- User selects matching term against a 7-second timer
- Best for: Quick recall and memorization

### True & False
- Statement that can be evaluated as true or false
- Include explanation for both correct and incorrect responses
- Best for: Testing understanding of rules and policies
