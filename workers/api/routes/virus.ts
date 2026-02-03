import { Hono } from 'hono';
import { validateVirusHash } from '../utils/hash';
import { GameStateService } from '../services/game-state';
import { generateId } from '../utils/id-generator';
import type {
  CreateVirusRequest,
  VirusResponse,
  ErrorResponse,
  Virus
} from '../../../shared/types';

interface Env {
  abandon_ai_db: D1Database;
}

const app = new Hono<{ Bindings: Env }>();

app.get('/search', async (c) => {
  try {
    const query = (c.req.query('q') || '').trim();

    if (!query) {
      return c.json({ success: false, error: 'Missing query parameter: q' }, 400);
    }

    const service = new GameStateService(c.env.abandon_ai_db);
    const viruses = await service.searchVirusesByHashOrAddress(query);

    return c.json({ success: true, viruses });
  } catch (error) {
    console.error('Error searching viruses:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

app.get('/', async (c) => {
  try {
    const page = Number(c.req.query('page')) || 1;
    const limit = Number(c.req.query('limit')) || 30;

    const service = new GameStateService(c.env.abandon_ai_db);
    const { items, total } = await service.getActiveVirusesPaginated(page, limit);

    return c.json({
      success: true,
      viruses: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching viruses:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

app.post('/', async (c) => {
  try {
    const body = await c.req.json<CreateVirusRequest>();
    const { address, timestamp, nonce, difficulty, memo = '' } = body;

    // Validate required fields
    if (!address || timestamp === undefined || nonce === undefined || difficulty === undefined) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: 'Missing required fields: address, timestamp, nonce, difficulty',
      };
      return c.json(errorResponse, 400);
    }

    // Validate PoW
    const validation = await validateVirusHash(
      address,
      timestamp,
      nonce,
      difficulty,
      memo
    );

    if (!validation.valid) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: validation.error || 'Validation failed',
      };
      return c.json(errorResponse, 400);
    }

    // Create virus object
    const virus: Virus = {
      id: generateId(),
      hash: validation.hash!,
      createdBy: address,
      createdAt: Math.floor(Date.now() / 1000),
      timestamp,
      nonce,
      difficulty,
      memo: memo || undefined,
      status: 'active',
    };

    // Persist to D1
    const service = new GameStateService(c.env.abandon_ai_db);

    try {
      await service.createVirus(virus);
    } catch (error: any) {
      // Handle duplicate hash error
      if (error.message && error.message.includes('UNIQUE')) {
        const errorResponse: ErrorResponse = {
          success: false,
          error: 'Virus with this hash already exists',
        };
        return c.json(errorResponse, 409);
      }
      throw error;
    }

    // Get updated stats
    const stats = await service.getStats();

    const response: VirusResponse = {
      success: true,
      virus,
      stats,
    };

    return c.json(response, 200);
  } catch (error) {
    console.error('Error creating virus:', error);
    const errorResponse: ErrorResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return c.json(errorResponse, 500);
  }
});

export default app;
