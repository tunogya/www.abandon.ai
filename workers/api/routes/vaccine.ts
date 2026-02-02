import { Hono } from 'hono';
import { validateVaccineHash } from '../utils/hash';
import { GameStateService } from '../services/game-state';
import { generateId } from '../utils/id-generator';
import type {
  CreateVaccineRequest,
  VaccineResponse,
  ErrorResponse,
  Vaccine,
} from '../../../shared/types';

interface Env {
  abandon_ai_db: D1Database;
}

const app = new Hono<{ Bindings: Env }>();

app.get('/', async (c) => {
  try {
    const page = Number(c.req.query('page')) || 1;
    const limit = Number(c.req.query('limit')) || 30;

    const service = new GameStateService(c.env.abandon_ai_db);
    const { items, total } = await service.getVaccinesPaginated(page, limit);

    return c.json({
      success: true,
      vaccines: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching vaccines:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

app.post('/', async (c) => {
  try {
    const body = await c.req.json<CreateVaccineRequest>();
    const { address, target, timestamp, nonce } = body;

    // Validate required fields
    if (!address || !target || timestamp === undefined || nonce === undefined) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: 'Missing required fields: address, target, timestamp, nonce',
      };
      return c.json(errorResponse, 400);
    }

    const service = new GameStateService(c.env.abandon_ai_db);

    // Check if target virus exists and is active
    const targetVirus = await service.getVirusByHash(target);

    if (!targetVirus) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: 'Target virus not found',
      };
      return c.json(errorResponse, 404);
    }

    if (targetVirus.status === 'eliminated') {
      const errorResponse: ErrorResponse = {
        success: false,
        error: 'Target virus already eliminated',
      };
      return c.json(errorResponse, 400);
    }

    // Validate PoW (must match target virus difficulty)
    const validation = await validateVaccineHash(
      address,
      target,
      timestamp,
      nonce,
      targetVirus.difficulty
    );

    if (!validation.valid) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: validation.error || 'Validation failed',
      };
      return c.json(errorResponse, 400);
    }

    // Create vaccine object
    const vaccine: Vaccine = {
      id: generateId(),
      hash: validation.hash!,
      createdBy: address,
      createdAt: Math.floor(Date.now() / 1000),
      target,
      timestamp,
      nonce,
      success: true,
      virusId: targetVirus.id,
    };

    // Atomically create vaccine and eliminate virus
    const updatedVirus = await service.createVaccine(vaccine, target);

    // Get updated stats
    const stats = await service.getStats();

    const response: VaccineResponse = {
      success: true,
      vaccine,
      virus: updatedVirus,
      stats,
    };

    return c.json(response, 200);
  } catch (error) {
    console.error('Error creating vaccine:', error);
    const errorResponse: ErrorResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return c.json(errorResponse, 500);
  }
});

export default app;
