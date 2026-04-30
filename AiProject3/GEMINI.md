# GEMINI.md - Project Context

## Project Overview
**UP Police Citizen Service & Incident Reporting Portal**: A web-based application designed for citizens to report incidents and track their status, with an administrative dashboard for police technical services.

## Project Type
**Status:** Functional Prototype (Vanilla JS SPA)

## Current Structure
- `index.html`: Main structure of the application, including sections for Home, Incident Reporting, Tracking, and Admin Dashboard.
- `script.js`: Core application logic including navigation, form handling, local storage persistence, and admin functionality.
- `style.css`: Professional government-themed styling and responsive design.

## Features
- **Incident Reporting:** Form for citizens to submit details of various incident types.
- **Status Tracking:** Search functionality to track reports using a unique Complaint ID.
- **Admin Dashboard:** Statistics and table view for managing submitted reports (Demo Only, uses localStorage).
- **Responsive Design:** Mobile-friendly navigation and layout.

## Building and Running
*   **Local View:** Open `index.html` directly in your browser or run a local server:
    - **Python:** `python3 -m http.server 8000`
    - **Node.js (npx):** `npx serve .`
*   **Data Persistence:** Uses browser `localStorage` to store incident reports locally.

## Version Control & Rollbacks
This project uses **Git** for version control.
*   **Check Status:** `git status`
*   **Commit Changes:** `git add . && git commit -m "Your message"`
*   **View History:** `git log --oneline`
*   **Rollback to Previous Version:**
    - To undo recent uncommitted changes: `git checkout -- <file>`
    - To temporarily switch to an old version: `git checkout <commit-hash>`
    - To permanently revert a specific commit: `git revert <commit-hash>`

## Development Conventions
*   **Tech Stack:** Vanilla HTML5, CSS3, and ES6+ JavaScript.
*   **Navigation:** SPA-style navigation handled via JavaScript by toggling section visibility.
*   **AI Context:** Keep this file updated as new features or architectural changes are implemented.

