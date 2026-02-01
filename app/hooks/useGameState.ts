import { useState, useEffect, useCallback } from 'react';
import PartySocket from 'partysocket';
import type { Virus, GameStats, ServerMessage, MessageType } from '../types';

interface GameState {
  activeViruses: Virus[];
  stats: GameStats;
  connected: boolean;
  error: string | null;
}

const initialStats: GameStats = {
  totalVirusesCreated: 0,
  activeViruses: 0,
  eliminatedViruses: 0,
  uniqueAddresses: 0,
};

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>({
    activeViruses: [],
    stats: initialStats,
    connected: false,
    error: null,
  });
  const [socket, setSocket] = useState<PartySocket | null>(null);

  useEffect(() => {
    // Determine PartyKit host based on environment
    const isLocalhost = typeof window !== 'undefined' &&
      window.location.hostname === 'localhost';

    const host = isLocalhost
      ? 'localhost:1999'
      : 'www-abandon-ai-party.tunogya.partykit.dev';

    // Create PartySocket connection
    const partySocket = new PartySocket({
      host,
      room: 'main',
    });

    partySocket.addEventListener('open', () => {
      console.log('Connected to PartyKit');
      setGameState((prev) => ({ ...prev, connected: true, error: null }));
    });

    partySocket.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data) as ServerMessage;

        switch (message.type) {
          case 'STATUS_UPDATE':
            setGameState((prev) => ({
              ...prev,
              activeViruses: message.activeViruses,
              stats: message.stats,
            }));
            break;

          case 'VIRUS_CREATED':
            setGameState((prev) => ({
              ...prev,
              activeViruses: [...prev.activeViruses, message.virus],
              stats: message.stats,
            }));
            break;

          case 'VIRUS_ELIMINATED':
            setGameState((prev) => ({
              ...prev,
              activeViruses: prev.activeViruses.filter(
                (v) => v.hash !== message.virus.hash
              ),
              stats: message.stats,
            }));
            break;

          case 'ERROR':
            setGameState((prev) => ({
              ...prev,
              error: message.error,
            }));
            break;
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    partySocket.addEventListener('close', () => {
      console.log('Disconnected from PartyKit');
      setGameState((prev) => ({ ...prev, connected: false }));
    });

    partySocket.addEventListener('error', (error) => {
      console.error('PartySocket error:', error);
      setGameState((prev) => ({
        ...prev,
        connected: false,
        error: 'Connection error',
      }));
    });

    setSocket(partySocket);

    return () => {
      partySocket.close();
    };
  }, []);

  const requestStatus = useCallback(() => {
    if (socket) {
      socket.send(JSON.stringify({ type: 'GET_STATUS' }));
    }
  }, [socket]);

  const requestHistory = useCallback((limit: number = 100) => {
    if (socket) {
      socket.send(JSON.stringify({ type: 'GET_HISTORY', limit }));
    }
  }, [socket]);

  return {
    ...gameState,
    requestStatus,
    requestHistory,
  };
}
