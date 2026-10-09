# Assessment Portal

A responsive React assessment application with a 10-minute countdown,
question navigation, automatic submission, answer review, and progress
persistence using localStorage.

## Features

- 10 assessment questions stored in a local JSON file
- Single useReducer for assessment state
- Start screen and 10-minute countdown
- Previous and Next navigation
- Answer selection and progress tracking
- Automatic submission when the timer expires
- State restoration after refreshing the page
- Score, percentage, and answer review
- Restart assessment
- Responsive Tailwind CSS design

## Technologies Used

- React
- Vite
- JavaScript
- Tailwind CSS v4
- Browser localStorage

## Prerequisites

- Node.js (LTS recommended)
- npm
- Git

## Setup

Clone the repository:

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd assessment-app
```

Install dependencies:

```bash
npm install
npm install -D tailwindcss @tailwindcss/vite
```

Start the development server:

```bash
npm run dev
```

Open the local URL shown in the terminal.

## Build for Production

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Important Implementation Details

- `public/questions.json` contains the assessment questions.
- `useReducer` manages questions, navigation, answers, timer, and status.
- `useEffect` handles question loading, persistence, and the countdown.
- `localStorage` preserves progress across page refreshes.
- The score is calculated by comparing selected answers with correct answers.
- All results are displayed on the same page.

## Note

This is a client-side demonstration assessment. The correct answers
are available in the client-side JSON file, so it is not suitable
for secure, high-stakes examinations without a backend.