import { useLocation, useNavigate } from "react-router-dom";
import { GameTable } from "./GameTable";

export function GamePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { players, playerId, gameCode } = location.state || {};

  if (!players || !playerId || !gameCode) {
    navigate("/"); // fallback if accessed directly
    return null;
  }

  return (
    <GameTable
      players={players}
      playerId={playerId}
    />
  );
}