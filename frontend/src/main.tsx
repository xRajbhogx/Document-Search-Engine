import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from 'next-themes'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* attribute="class": dark mode = a `dark` class on <html>. Starts from the OS setting until the user picks one.
        scriptProps: next-themes renders an inline script that only runs with server rendering; marking it as
        data stops React's warning. index.html does that job here instead. */}
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      scriptProps={{ type: "application/json" }}
    >
      <App />
    </ThemeProvider>
  </StrictMode>,
)
