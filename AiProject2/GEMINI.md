# Project Mandates (GEMINI.md)

This file contains foundational mandates for the Gemini CLI agent. Instructions here take absolute precedence over general workflows and tool defaults.

## Project Overview
- **Name:** Merge Master (AiProject2)
- **Description:** A professional, dark-themed PDF merger application that allows users to upload multiple PDFs, specify page ranges, and reorder files before merging into a single document.

## Tech Stack
- **Frontend:** React 18, Vite, TypeScript, Lucide Icons, React Dropzone.
- **Backend:** Node.js, Express, TypeScript, pdf-lib (for PDF manipulation), Multer (for file handling).
- **Styling:** Custom CSS with a "Midnight" dark theme.

## Architecture & Security
- **In-Memory Processing:** All PDF operations are performed in-memory on the server. No files are permanently stored on disk, ensuring user privacy.
- **Explicit Interactions:** File selection is explicitly triggered to prevent accidental UI collisions.
- **Concurrent Development:** Root-level scripts manage both frontend and backend services.

## Workflow Specifics
- **Start Project:** Run `npm start` in the root directory to launch both the frontend (Port 5173) and backend (Port 3001).
- **Hard Refresh:** After making UI changes, a hard refresh (`Ctrl + F5`) is often required due to Vite's aggressive caching.
- **Backend Config:** Backend is configured as an ES Module (`type: module`) using `ts-node-esm`.

## Future Roadmap
- Local LLM integration (Ollama) for private PDF summarization and analysis.
