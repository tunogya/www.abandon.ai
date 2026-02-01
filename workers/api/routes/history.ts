import { Hono } from 'hono';
import { GameStateService } from '../services/game-state';
import type { HistoryResponse } from '../../../shared/types';

interface Env {
  abandon_ai_db: D1Database;
}

const app = new Hono<{ Bindings: Env }>();

app.get('/', async (c) => {
  try {
    const limitParam = c.req.query('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 100;

    // Validate limit
    const validLimit = Math.min(Math.max(1, limit), 1000); // Cap at 1000

    const service = new GameStateService(c.env.abandon_ai_db);

    const viruses = await service.getVirusHistory(validLimit);
    const vaccines = await service.getVaccineHistory(validLimit);

    const response: HistoryResponse = {
      viruses,
      vaccines,
    };

    return c.json(response, 200);
  } catch (error) {
    console.error('Error getting history:', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

export default app;
