let app;

export default async function handler(req, res) {
  try {
    if (!app) {
      const module = await import('../src/app.js');
      app = module.createApp();
    }

    return app(req, res);
  } catch (error) {
    console.error('API bootstrap error', error);
    return res.status(500).json({
      error: 'Function bootstrap error',
      code: error?.code || null,
      message: error?.message || 'Unknown bootstrap error'
    });
  }
}
