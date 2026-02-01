import { Hono } from 'hono';
import { cors } from 'hono/cors';
import virusRoutes from './routes/virus';
import vaccineRoutes from './routes/vaccine';
import statusRoutes from './routes/status';
import historyRoutes from './routes/history';

interface Env {
  abandon_ai_db: D1Database;
}

const app = new Hono<{ Bindings: Env }>();

// CORS middleware - allow all origins
app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}));

// Health check endpoint
app.get('/', (c) => {
  return c.json({
    service: 'abandon.ai API',
    version: '1.0.0',
    status: 'healthy',
  });
});

// API routes
app.route('/api/virus', virusRoutes);
app.route('/api/vaccine', vaccineRoutes);
app.route('/api/status', statusRoutes);
app.route('/api/history', historyRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({ success: false, error: 'Not found' }, 404);
});

// Global error handler
app.onError((err, c) => {
  console.error('Global error:', err);
  return c.json(
    {
      success: false,
      error: err.message || 'Internal server error',
    },
    500
  );
});

export default app;
