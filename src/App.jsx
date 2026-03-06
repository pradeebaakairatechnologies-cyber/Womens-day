
import './App.css'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
function App() {

  return (
    <>
      <div className="logo-container">
        <img src="/images/JCI1.png" alt="Logo" style={{ height: '100px', objectFit: 'contain' }} />
      </div>

      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>

      <div style={{
        position: 'fixed',
        bottom: '10px',
        width: '100%',
        textAlign: 'center',
        color: 'rgba(255, 255, 255)',
        fontSize: '2rem',
        fontWeight: 'bold',
        pointerEvents: 'none',
        zIndex: 9999
      }}>
        <a href="https://kairatechnologies.in" target="_blank" rel="noopener noreferrer" style={{ pointerEvents: 'auto', color: 'inherit', textDecoration: 'none' }}>Designed by Kaira Technologies</a>
      </div>
    </>
  )
}

export default App
