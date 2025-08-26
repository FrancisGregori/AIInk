import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';

process.env.DATABASE_URL = 'postgres://user:pass@localhost/db';

const { registerRoutes } = await import('../routes');
const { storage } = await import('../storage');
const { db } = await import('../db');

test('GET /api/flux/projects returns 200 with empty array when storage.getFluxProjects fails', async () => {
  const app = express();
  const httpServer = await registerRoutes(app);

  const originalGetFluxProjects = storage.getFluxProjects;
  const originalDbSelect = db.select;

  (storage as any).getFluxProjects = async () => { throw new Error('storage fail'); };
  (db as any).select = () => ({
    from: () => ({
      orderBy: () => ({ limit: () => [] })
    })
  });

  const server = httpServer.listen(0);
  const { port } = server.address() as any;

  const response = await fetch(`http://localhost:${port}/api/flux/projects`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body, []);

  server.close();
  (storage as any).getFluxProjects = originalGetFluxProjects;
  (db as any).select = originalDbSelect;
});

test('GET /api/flux/projects returns 200 with empty array when dependencies fail', async () => {
  const app = express();
  const httpServer = await registerRoutes(app);

  const originalGetFluxProjects = storage.getFluxProjects;
  const originalDbSelect = db.select;
  (storage as any).getFluxProjects = async () => { throw new Error('storage fail'); };
  (db as any).select = () => { throw new Error('db fail'); };

  const server = httpServer.listen(0);
  const { port } = server.address() as any;

  const response = await fetch(`http://localhost:${port}/api/flux/projects`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body, []);

  server.close();
  (storage as any).getFluxProjects = originalGetFluxProjects;
  (db as any).select = originalDbSelect;
});

test('GET /api/gallery returns 200 with empty array when dependencies fail', async () => {
  const app = express();
  const httpServer = await registerRoutes(app);

  const originalDbSelect = db.select;
  const originalGetUserGallery = storage.getUserGallery;
  (db as any).select = () => { throw new Error('db fail'); };
  (storage as any).getUserGallery = async () => { throw new Error('storage fail'); };

  const server = httpServer.listen(0);
  const { port } = server.address() as any;

  const response = await fetch(`http://localhost:${port}/api/gallery`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body, []);

  server.close();
  (db as any).select = originalDbSelect;
  (storage as any).getUserGallery = originalGetUserGallery;
});