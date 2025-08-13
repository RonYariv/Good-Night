import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import './App.css'
import { Lobby } from './Lobby'
import { RoomPage } from './RoomPage'

function App() {

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Lobby />} />
          <Route path="/room/:gameCode" element={<RoomPage />} />
        </Routes>
      </Router>
    </>
  )
}

export default App
