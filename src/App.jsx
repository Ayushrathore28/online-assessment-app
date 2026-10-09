
import { useEffect, useReducer } from 'react'

const STORAGE_KEY = 'assessment-app-state'
const TIME_LIMIT = 600

const initialState = {
  questions: [],
  currentQuestion: 0,
  answers: {},
  timeLeft: TIME_LIMIT,
  status: 'loading',
  ready: false,
  error: null
}

function reducer(state, action) {
  switch (action.type) {
    case 'INIT':
      return {
        ...action.savedState,
        questions: action.questions,
        ready: true
      }
      case 'LOAD_ERROR':
  return {
    ...state,
    ready: true,
    questions: [],
    error: action.message
  }

    case 'START':
      return {
        ...state,
        status: 'in-progress'
      }

    case 'ANSWER':
      if (state.status !== 'in-progress') return state
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.questionId]: action.answer
        }
      }

    case 'NAVIGATE':
      return {
        ...state,
        currentQuestion: Math.max(
          0,
          Math.min(action.index, state.questions.length - 1)
        )
      }

    case 'TICK':
      if (state.status !== 'in-progress') return state

      if (state.timeLeft <= 1) {
        return { ...state, timeLeft: 0, status: 'submitted' }
      }

      return { ...state, timeLeft: state.timeLeft - 1 }

    case 'SUBMIT':
      return { ...state, status: 'submitted' }

    case 'RESTART':
      return {
        ...initialState,
        questions: state.questions,
        status: 'start',
        ready: true
      }

    default:
      return state
  }
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(
    remainingSeconds
  ).padStart(2, '0')}`
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    let cancelled = false

    async function initialize() {
      try {
        const response = await fetch('/questions.json')
        if (!response.ok) throw new Error('Could not load questions')

        const questions = await response.json()
        const saved = localStorage.getItem(STORAGE_KEY)
        let savedState = { ...initialState, status: 'start' }

        if (saved) {
          try {
            const parsed = JSON.parse(saved)
            const validStatuses = [
              'start',
              'in-progress',
              'submitted'
            ]

            if (
              parsed.version === 1 &&
              validStatuses.includes(parsed.status) &&
              Number.isInteger(parsed.currentQuestion) &&
              Number.isFinite(parsed.timeLeft) &&
              parsed.timeLeft >= 0 &&
              parsed.timeLeft <= TIME_LIMIT &&
              parsed.answers &&
              typeof parsed.answers === 'object' &&
              !Array.isArray(parsed.answers)
            ) {
              savedState = {
                ...savedState,
                currentQuestion: Math.max(
                  0,
                  Math.min(parsed.currentQuestion, questions.length - 1)
                ),
                answers: parsed.answers,
                timeLeft: parsed.timeLeft,
                status: parsed.status
              }
            }
          } catch {
            localStorage.removeItem(STORAGE_KEY)
          }
        }

        if (!cancelled) {
          dispatch({ type: 'INIT', questions, savedState })
        }
      }  catch (error) {
  console.error('Assessment loading failed:', error)

  if (!cancelled) {
    dispatch({
      type: 'LOAD_ERROR',
      message: error.message
    })
  }
}
      
    }

    initialize()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!state.ready) return

    const { questions, ...savedState } = state

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...savedState, version: 1 })
    )
  }, [state])

  useEffect(() => {
    if (state.status !== 'in-progress') return

    const timer = setInterval(() => {
      dispatch({ type: 'TICK' })
    }, 1000)

    return () => clearInterval(timer)
  }, [state.status])

  if (!state.ready) {
    return (
      <main className="grid min-h-screen place-items-center p-6">
        <p className="text-slate-600">Loading assessment...</p>
      </main>
    )
  }

  if (!state.questions.length) {
    return (
      <main className="grid min-h-screen place-items-center p-6">
        <p className="text-red-600">
           {state.error || 'Check public/questions.json'}
          Questions could not be loaded. Please refresh the page.
        </p>
      </main>
    )
  }

  const { questions, currentQuestion, answers, timeLeft, status } = state
  const question = questions[currentQuestion]

  const score = questions.reduce(
    (total, item) =>
      total + (answers[item.id] === item.correctAnswer ? 1 : 0),
    0
  )

  const percentage = Math.round((score / questions.length) * 100)

  function restart() {
    localStorage.removeItem(STORAGE_KEY)
    dispatch({ type: 'RESTART' })
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 sm:px-6 lg:py-12">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
            Skills Assessment
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Assessment Portal
          </h1>
          <p className="mt-2 text-slate-600">
            Test your knowledge and review your results.
          </p>
        </header>

        {status === 'start' && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
            <h2 className="text-2xl font-bold">Ready to begin?</h2>
            <p className="mt-3 text-slate-600">
              Answer all questions before the countdown ends.
            </p>

            <div className="my-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-indigo-50 p-5">
                <p className="text-sm text-indigo-700">Total questions</p>
                <p className="mt-2 text-3xl font-bold">
                  {questions.length}
                </p>
              </div>
              <div className="rounded-xl bg-slate-100 p-5">
                <p className="text-sm text-slate-600">Time limit</p>
                <p className="mt-2 text-3xl font-bold">10 minutes</p>
              </div>
            </div>

            <button
              onClick={() => dispatch({ type: 'START' })}
              className="w-full rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 sm:w-auto"
            >
              Start Assessment
            </button>
          </section>
        )}

        {status === 'in-progress' && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-5">
              <p className="font-semibold">
                Question {currentQuestion + 1} of {questions.length}
              </p>
              <p
                role="timer"
                aria-live="off"
                className={`rounded-lg px-4 py-2 font-bold tabular-nums ${
                  timeLeft <= 60
                    ? 'bg-red-100 text-red-700'
                    : 'bg-indigo-50 text-indigo-700'
                }`}
              >
                {formatTime(timeLeft)}
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {questions.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() =>
                    dispatch({ type: 'NAVIGATE', index })
                  }
                  aria-label={`Go to question ${index + 1}`}
                  aria-current={index === currentQuestion ? 'step' : undefined}
                  className={`grid h-10 w-10 place-items-center rounded-lg border text-sm font-semibold ${
                    index === currentQuestion
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : answers[item.id]
                        ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            <h2 className="mt-8 text-xl font-semibold leading-relaxed sm:text-2xl">
              {question.question}
            </h2>

            <div className="mt-6 space-y-3">
              {question.options.map((option) => (
                <label
                  key={option}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                    answers[question.id] === option
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={option}
                    checked={answers[question.id] === option}
                    onChange={() =>
                      dispatch({
                        type: 'ANSWER',
                        questionId: question.id,
                        answer: option
                      })
                    }
                    className="mt-1 accent-indigo-600"
                  />
                  <span className="break-words">{option}</span>
                </label>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                disabled={currentQuestion === 0}
                onClick={() =>
                  dispatch({
                    type: 'NAVIGATE',
                    index: currentQuestion - 1
                  })
                }
                className="rounded-xl border border-slate-300 px-5 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              {currentQuestion < questions.length - 1 ? (
                <button
                  onClick={() =>
                    dispatch({
                      type: 'NAVIGATE',
                      index: currentQuestion + 1
                    })
                  }
                  className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (window.confirm('Submit your assessment?')) {
                      dispatch({ type: 'SUBMIT' })
                    }
                  }}
                  className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700"
                >
                  Submit Assessment
                </button>
              )}
            </div>

            <p className="mt-4 text-sm text-slate-500">
              Answered {Object.keys(answers).filter(
                (id) => questions.some((item) => String(item.id) === id)
              ).length} of {questions.length} questions
            </p>
          </section>
        )}

        {status === 'submitted' && (
          <>
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <p className="font-semibold text-emerald-700">
                Assessment submitted
              </p>
              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                Your Results
              </h2>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-indigo-50 p-5">
                  <p className="text-sm text-indigo-700">Score</p>
                  <p className="mt-2 text-3xl font-bold">
                    {score}/{questions.length}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-100 p-5">
                  <p className="text-sm text-slate-600">Total questions</p>
                  <p className="mt-2 text-3xl font-bold">
                    {questions.length}
                  </p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-5">
                  <p className="text-sm text-emerald-700">Percentage</p>
                  <p className="mt-2 text-3xl font-bold">{percentage}%</p>
                </div>
              </div>

              <button
                onClick={restart}
                className="mt-6 w-full rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 sm:w-auto"
              >
                Restart Assessment
              </button>
            </section>

            <section className="mt-8">
              <h2 className="mb-4 text-2xl font-bold">Answer Review</h2>

              <div className="space-y-4">
                {questions.map((item, index) => {
                  const selected = answers[item.id]
                  const correct = selected === item.correctAnswer

                  return (
                    <article
                      key={item.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <h3 className="font-semibold leading-relaxed">
                          {index + 1}. {item.question}
                        </h3>
                        <span
                          className={`rounded-full px-3 py-1 text-sm font-semibold ${
                            correct
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {correct ? 'Correct' : 'Incorrect'}
                        </span>
                      </div>

                      <p className="mt-4 break-words text-sm text-slate-600">
                        Your answer: {selected || 'Not answered'}
                      </p>
                      <p className="mt-2 break-words text-sm font-medium text-emerald-700">
                        Correct answer: {item.correctAnswer}
                      </p>
                    </article>
                  )
                })}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  )
}