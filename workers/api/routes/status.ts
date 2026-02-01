import { Hono } from 'hono';
import { GameStateService } from '../services/game-state';
import type { StatusResponse } from '../../../shared/types';

interface Env {
  abandon_ai_db: D1Database;
}

const app = new Hono<{ Bindings: Env }>();

app.get('/', async (c) => {
  try {
    const service = new GameStateService(c.env.abandon_ai_db);

    const activeViruses = await service.getActiveViruses();
    const stats = await service.getStats();

    const response: StatusResponse = {
      activeViruses,
      stats,
    };

    return c.json(response, 200);
  } catch (error) {
    console.error('Error getting status:', error);
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
