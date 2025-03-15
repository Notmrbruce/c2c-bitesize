# C2C Bitesize Learning Platform

A modular web-based learning platform for C2C training materials.

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
  "methods": ["flashcards", "quiz", "match"],
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
    "match": [
      { "term": "Term", "definition": "Definition" },
      // More match pairs...
    ]
  }
}
```

## How to Update Existing Modules

1. Locate the module's JSON file in `data/modules/`
2. Edit the file to update content
3. Save the file and reload the application

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
4. For match pairs, keep terms and definitions reasonably short
5. Include 10-15 items per learning method for optimal learning experience
