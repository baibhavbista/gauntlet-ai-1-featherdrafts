# FeatherDrafts: Grammarly for Twitter Threads

## About the app

This app is a real-time writing assistant built specifically for Twitter creators who write high-impact threads. It helps users draft, edit, and refine tweet threads using live grammar suggestions, AI-powered tone rewriting, and structure-aware character limits.

Writers work in a focused, rich-text editor that visually stacks each tweet in a thread, with a character counter and clear overflow warnings. As users write, the app provides inline grammar and spellcheck suggestions, helping them stay sharp and concise. Long drafts are automatically split into thread-ready segments with a clean, tweet-by-tweet layout.

For tone and voice, users can choose from predefined styles (like witty, professional, persuasive) and get full-thread GPT-4o suggestions — including full rewrites that open in a sidebar for comparison. Writers can also import their Twitter archive to train the AI to better match their personal writing style.

Once finished, users can export their entire thread as clean Markdown for fast pasting into Twitter or scheduling tools. Whether you're writing from scratch or refining your brand voice, the app is your creative command center for tweet threads.

## Technical details
Of course, I can provide a detailed analysis of your codebase. Here's a comprehensive breakdown of the system architecture, libraries, and technical considerations.

### System Architecture
(Generated thanks to Gemini 2.5 pro and Repomix)

This is a modern, full-stack web application built with **Next.js 15** using the **App Router**. The architecture is well-organized, following best practices for a React-based framework. It leverages server-side rendering (SSR) and client-side interactivity, with a clear separation of concerns.

#### Core Components:

* **Frontend**: Built with **Next.js** and **React**, using **TypeScript** for type safety. The UI is constructed with a combination of custom components and a UI library, styled with **Tailwind CSS**.
* **Backend**: The application uses **Supabase** as its backend-as-a-service (BaaS) provider. This includes a **PostgreSQL** database for data storage, authentication services, and Row-Level Security (RLS) for data protection.
* **State Management**: Global state is managed using **Zustand**, a lightweight and scalable state management library. The store is modularized into "slices" for different domains of the application (authentication, threads, editor, UI, and navigation).
* **Styling**: The application uses **Tailwind CSS** for utility-first styling, along with **shadcn/ui** for pre-built, accessible, and themeable UI components. This is evident from the `tailwind.config.ts`, `globals.css`, and the `components/ui` directory.
* **Database Schema**: The database schema is defined in SQL scripts within the `scripts/supabase` directory. It includes tables for `threads`, `tweet_segments`, `suggestions`, and `user_preferences`. The schema is well-structured with appropriate indexes, functions, triggers, and RLS policies for security and performance.

### File and Directory Structure

The project follows a logical and organized structure:

* `app/`: Contains the application's routes, following the Next.js App Router conventions. Each route has its own `page.tsx`, and some have specific `loading.tsx` and `error.tsx` files for better user experience.
* `components/`: This directory houses all the React components. It's further divided into:
    * `auth/`: Components related to authentication.
    * `ui/`: Reusable UI components, likely from shadcn/ui, such as `Button`, `Card`, `Input`, etc.
* `docs/`: A collection of Markdown files that provide excellent documentation on various aspects of the project, including authentication fixes, error handling, and refactoring efforts.
* `hooks/`: Contains custom React hooks, such as `useNavigation` and `useErrorHandler`, which encapsulate reusable logic.
* `lib/`: Utility functions and library initializations. `supabase.ts` and `database.ts` are key files here for interacting with the Supabase backend.
* `public/`: Static assets like images and logos.
* `scripts/`: Contains SQL scripts for setting up the Supabase database.
* `store/`: This is where the Zustand state management is defined, with a main `index.ts` file and a `slices/` directory for each part of the application's state.
* `styles/`: Global CSS files.
* `types/`: TypeScript type definitions, which are crucial for maintaining a type-safe codebase.

### Libraries and Dependencies

Based on the `package.json` file, here are the key libraries and their roles:

#### Frameworks and Core Libraries:

* **`next`**: The core React framework for building the application.
* **`react`**, **`react-dom`**: The fundamental libraries for building the user interface.
* **`typescript`**: For static typing, which improves code quality and maintainability.
* **`zod`**: Used for schema declaration and validation, likely for form validation.

#### UI and Styling:

* **`tailwindcss`**: A utility-first CSS framework for rapid UI development.
* **`shadcn-ui` (via `@radix-ui/*` and `lucide-react`)**: A collection of beautifully designed, accessible, and customizable UI components.
* **`class-variance-authority`**, **`clsx`**, **`tailwind-merge`**: Utilities for creating dynamic and conditional CSS classes.
* **`next-themes`**: For managing dark and light mode themes.

#### State Management:

* **`zustand`**: A small, fast, and scalable state-management solution. It's used here to manage global application state.
* **`immer`**: A library that simplifies handling immutable state, used within Zustand.

#### Backend and Database:

* **`@supabase/supabase-js`**: The official JavaScript client library for interacting with Supabase.

#### Content and Text Processing:

* **`nspell`**: A spell-checking library.
* **`write-good`**: A library for checking grammar and writing style.

### Technical Considerations and Best Practices

For anyone diving into this codebase, here are some key technical points and best practices that have been implemented:

* **Component-Based Architecture**: The application is built with a strong emphasis on reusable components, which makes the codebase modular and easier to maintain.
* **State Management with Zustand**: The use of Zustand with a sliced structure is a modern and efficient way to manage state. It avoids the verbosity of Redux while providing a centralized and predictable state container.
* **Supabase Integration**: The backend is well-integrated with Supabase. The SQL scripts in `scripts/supabase` are particularly important as they define the entire database schema and security rules. Understanding these scripts is crucial for any backend work.
* **Row-Level Security (RLS)**: The database is secured with RLS policies, which is a best practice for multi-tenant applications. This ensures that users can only access their own data.
* **Custom Hooks**: The use of custom hooks like `useNavigation` and `useErrorHandler` is a great way to abstract away complex logic and make it reusable across the application.
* **Error Handling**: The application has a robust error handling strategy, with custom error pages (`app/error.tsx`), error boundaries (`components/ui/error-boundary.tsx`), and a dedicated error handling hook (`hooks/useErrorHandler.ts`).
* **Loading States**: The use of `loading.tsx` files and loading spinners provides a good user experience by showing loading indicators during data fetching and route transitions.
* **Documentation**: The `docs/` directory is a valuable resource. It provides context on architectural decisions, refactoring efforts, and a guide to the navigation system. This is a strong indicator of a well-maintained project.
* **TypeScript-First**: The codebase is written in TypeScript, which means there's a strong emphasis on type safety. Pay close attention to the `types/` directory to understand the data structures used throughout the application.

### Recommendations for a New Developer (or AI)

Before making any changes, it is highly recommended to:

1.  **Read the Documentation**: The `docs/` directory is the best place to start. It provides invaluable insights into the project's evolution and current state.
2.  **Understand the State Management**: Familiarize yourself with the Zustand store (`store/`) and its slices. This is central to how the application works.
3.  **Review the Database Schema**: Go through the SQL scripts in `scripts/supabase/`. Understanding the data model and security rules is essential for any feature development.
4.  **Explore the UI Components**: Look at the components in `components/ui/` to understand the design system and how to build new UI elements consistently.
5.  **Follow the Existing Patterns**: The codebase follows clear patterns for state management, error handling, and component structure. Adhering to these patterns will help maintain the quality and consistency of the code.

In summary, this is a well-architected, modern, and maintainable codebase. It leverages best practices and a solid set of libraries to create a robust and scalable application.