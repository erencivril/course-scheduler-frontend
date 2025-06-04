# University Course Scheduler Frontend (IEU)

This project is the frontend for the University Course Scheduler, an administrative tool designed for Izmir University of Economics (IEU) to efficiently manage course assignments, terms, and generate academic schedules. It features a modern, user-friendly interface built with React, Vite, and TypeScript.

**Backend Repository:** https://github.com/cannyasar/university-scheduler-backend/tree/rules-update

## Project Overview

The primary goal of this application is to streamline the course scheduling process for university administrators. It replaces manual, Excel-based methods with a robust, web-based solution, reducing errors and administrative overhead.

The system allows administrators to:
*   Securely log in to an admin-only dashboard.
*   Manage course listings and filter by terms.
*   Upload Excel files for bulk course assignment and initial schedule population.
*   Define expected student numbers for courses.
*   View and interact with a dynamically generated academic calendar, filterable by year.
*   Manage and review course details in a dedicated, read-only directory.

## Core Features

*   **Admin Dashboard:** Central hub for all scheduling operations, featuring a step-by-step wizard.
    *   **Step 1: Term Selection & Excel Upload:** Select an academic term and upload an Excel file containing course schedule information. The system processes this file to populate initial course session times.
    *   **Step 2: Course Configuration:** View all available courses (Software Engineering courses prioritized, then alphabetically), select courses for the term, and input expected student numbers for each.
    *   **Step 3: Calendar View & Management:**
        *   Interactive calendar displaying scheduled sections.
        *   Filterable by academic year (1-4).
        *   Unique background color for each course for easy identification.
        *   Adaptive text color (dark/white) for optimal contrast against course backgrounds.
        *   Clear visual distinction for Lab sections.
        *   Interactive elements with hover effects, subtle borders, and shadows.
        *   Assigned lecturers displayed as a vertical list with icons, adapting to item background color.
        *   "Start Over" functionality to clear existing sections for the term and reset the wizard.
*   **Courses Page:** A read-only directory of all university courses. Administrators can search for courses and view detailed information in a modal. This page is for reference; all course selection for scheduling occurs within the Dashboard wizard.
*   **Authentication:** Secure JWT-based authentication for all administrative actions, managed via `AuthContext`.
*   **Responsive Design:** Optimized for desktop and tablet use.
*   **Persistent State:** The dashboard wizard's current step is saved in `localStorage`, allowing admins to return to their last position.
*   **Error Handling:** Robust error handling and user feedback throughout the application.

## Project Structure

The frontend codebase is organized to promote modularity and maintainability:

*   `public/`: Static assets.
*   `src/`: Main application source code.
    *   `components/`: Reusable UI components.
    *   `pages/`: Top-level page components (e.g., `DashboardPage`, `CoursesPage`, `LoginPage`).
    *   `services/`: Modules for API interactions (e.g., `authService.ts`, `courseService.ts`, `scheduleService.ts`).
    *   `types/`: TypeScript type definitions and DTOs for API contracts and data structures.
    *   `contexts/`: React context providers (e.g., `AuthContext.tsx`).
    *   `hooks/`: Custom React hooks.
    *   `utils/`: Utility functions.
    *   `assets/`: Images, fonts, etc.
    *   `App.tsx`: Main application component.
    *   `main.tsx`: Application entry point.
    *   `theme.ts` (or similar): Centralized theme and styling configurations.
*   `eslint.config.js`: ESLint configuration.
*   `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`: TypeScript configurations.
*   `vite.config.ts`: Vite configuration.
*   `package.json`: Project dependencies and scripts.

## Setup and Installation

1.  **Prerequisites:**
    *   Node.js (version X.X.X or later - specify version if critical)
    *   npm or yarn

2.  **Clone the repository:**
    ```bash
    git clone https://github.com/erencivril/course-scheduler-frontend.git
    cd course-scheduler-frontend
    ```

3.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    The application should now be running on `http://localhost:5173` (or the port specified by Vite).

## Available Scripts

*   `npm run dev`: Starts the development server with Hot Module Replacement (HMR).
*   `npm run build`: Bundles the application for production.
*   `npm run lint`: Lints the codebase using ESLint.
*   `npm run preview`: Serves the production build locally for testing.

## Expanding the ESLint Configuration

This project uses a minimal ESLint setup. For production applications, consider enhancing the ESLint configuration for type-aware linting rules:

```javascript
// eslint.config.js
// (Ensure tseslint is imported or use the existing structure)
// import tseslint from 'typescript-eslint'; // If not already imported

export default [ // Or tseslint.config if that's the pattern used
  // ... other configurations
  ...tseslint.configs.recommendedTypeChecked, // For recommended type-checked rules
  // Or for stricter rules:
  // ...tseslint.configs.strictTypeChecked,
  // Optionally, for stylistic rules:
  // ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: true, // Simpler if tsconfigRootDir is set correctly
        // project: ['./tsconfig.json', './tsconfig.node.json'], // Or list them explicitly
        tsconfigRootDir: import.meta.dirname, // Or process.cwd() if in a CJS context and appropriate
      },
    },
    // ... other rules or overrides
  }
];
```
*Note: The exact ESLint configuration syntax might vary based on your `eslint.config.js` setup (e.g., if using the flat config format as shown, or the older `.eslintrc.js` format). Adjust the snippet above to match your project's ESLint setup style.*

You can also install `eslint-plugin-react-hooks` and `eslint-plugin-jsx-a11y` for more React-specific lint rules if not already included.

## About

This frontend is part of the University Course Scheduler system for IEU, aiming to provide an efficient and intuitive scheduling experience for administrators.

---

_This README provides a comprehensive guide to the University Course Scheduler Frontend. For backend details, please refer to the backend repository._
