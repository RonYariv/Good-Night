import React, { useState } from 'react';

interface LobbyProps {
  onCreateRoom: (roomName: string) => void;
  onJoinRoom: (roomId: string) => void;
}

export const Lobby: React.FC<LobbyProps> = ({ onCreateRoom, onJoinRoom }) => {
  const [createRoomName, setCreateRoomName] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>The Dark Lobby</h1>

      <div style={styles.card}>
        <h2 style={styles.subtitle}>Create New Room</h2>
        <input
          type="text"
          placeholder="Enter room name"
          value={createRoomName}
          onChange={e => setCreateRoomName(e.target.value)}
          style={styles.input}
        />
        <button
          style={styles.button}
          disabled={!createRoomName.trim()}
          onClick={() => {
            onCreateRoom(createRoomName.trim());
            setCreateRoomName('');
          }}
        >
          Summon Room
        </button>
      </div>

      <div style={styles.card}>
        <h2 style={styles.subtitle}>Join Existing Room</h2>
        <input
          type="text"
          placeholder="Enter room ID"
          value={joinRoomId}
          onChange={e => setJoinRoomId(e.target.value)}
          style={styles.input}
        />
        <button
          style={styles.button}
          disabled={!joinRoomId.trim()}
          onClick={() => {
            onJoinRoom(joinRoomId.trim());
            setJoinRoomId('');
          }}
        >
          Enter Shadows
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    width: '100%',
    height: '100%',
    minHeight: '100vh',
    background:
      'linear-gradient(135deg, #0d0d18 0%, #1a1a2e 40%, #2b2b42 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
    padding: '2rem',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    color: '#eee',
  },
  title: {
    fontSize: '3rem',
    fontWeight: '900',
    letterSpacing: '0.15em',
    textShadow: '0 0 8px #8e44ad',
    marginBottom: '2rem',
    userSelect: 'none',
  },
  card: {
    backgroundColor: '#121224',
    borderRadius: 12,
    padding: '2rem',
    width: 320,
    boxShadow:
      '0 0 10px 1px rgba(142, 68, 173, 0.8), inset 0 0 8px 1px #440066',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  subtitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#bb86fc',
    userSelect: 'none',
  },
  input: {
    padding: '0.75rem 1rem',
    borderRadius: 6,
    border: 'none',
    outline: 'none',
    fontSize: '1rem',
    backgroundColor: '#2a2244',
    color: '#ddd',
    boxShadow: 'inset 0 0 6px #440066',
    transition: 'background-color 0.3s',
  },
  button: {
    backgroundColor: '#8e44ad',
    border: 'none',
    borderRadius: 6,
    color: '#fff',
    fontWeight: '700',
    fontSize: '1rem',
    padding: '0.75rem',
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'background-color 0.3s',
  },
};