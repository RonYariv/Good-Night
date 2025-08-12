import './App.css'
import { Lobby } from './Lobby'

function App() {

  return (
    <div className="lobby-wrapper">
      <Lobby
    onCreateRoom={(roomName) => {
      console.log('Create room:', roomName);
      // Call your backend here
    }}
    onJoinRoom={(roomId) => {
      console.log('Join room:', roomId);
      // Call your backend here
    }}
  />
  </div>
  )
}

export default App
