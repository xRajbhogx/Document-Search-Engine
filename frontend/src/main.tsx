import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from 'next-themes'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* next-themes' inline script only runs with server rendering, so it is marked as data
        to stop a React warning. index.html sets the theme class instead. */}
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
