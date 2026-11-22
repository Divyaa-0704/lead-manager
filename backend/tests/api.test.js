import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createRequire } from 'module';

// Set test settings BEFORE the app loads
process.env.DB_FILE = ':memory:';
process.env.JWT_SECRET = 'test-secret';
process.env.MANAGER_EMAILS = 'boss@example.com';

const require = createRequire(import.meta.url);
const app = require('../app');

const validLead = {
  name: 'Asha Rao',
  email: 'asha@example.com',
  phone: '9876543210',
  company: 'Acme',
  source: 'Website',
  status: 'New',
};

async function signup(name, email) {
  const res = await request(app)
    .post('/api/auth/signup')
    .send({ name, email, password: 'password123' });
  return res.body.token;
}

const auth = (token) => ({ Authorization: `Bearer ${token}` });

let salesToken;
let otherToken;
let managerToken;

beforeAll(async () => {
  salesToken = await signup('Sam', 'sam@example.com');
  otherToken = await signup('Olivia', 'olivia@example.com');
  managerToken = await signup('Boss', 'boss@example.com');
});

describe('auth', () => {
  it('rejects a short password on signup', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'X', email: 'x@example.com', password: '123' });
    expect(res.status).toBe(400);
    expect(res.body.details.password).toBeDefined();
  });

  it('rejects a duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Sam', email: 'sam@example.com', password: 'password123' });
    expect(res.status).toBe(409);
  });

  it('rejects a wrong password on login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sam@example.com', password: 'wrong-password' });
    expect(res.status).toBe(401);
  });

  it('logs in with the right password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sam@example.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('gives the manager role only to listed emails', async () => {
    const boss = await request(app).get('/api/auth/me').set(auth(managerToken));
    const sam = await request(app).get('/api/auth/me').set(auth(salesToken));
    expect(boss.body.role).toBe('manager');
    expect(sam.body.role).toBe('sales');
  });
});

describe('leads API', () => {
  it('blocks requests without a login token', async () => {
    const res = await request(app).get('/api/leads');
    expect(res.status).toBe(401);
  });

  it('creates a lead', async () => {
    const res = await request(app).post('/api/leads').set(auth(salesToken)).send(validLead);
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Asha Rao');
    expect(res.body.status).toBe('New');
  });

  it('rejects an invalid lead with field errors', async () => {
    const res = await request(app)
      .post('/api/leads')
      .set(auth(salesToken))
      .send({ ...validLead, name: '', email: 'not-an-email', source: 'Banana' });
    expect(res.status).toBe(400);
    expect(res.body.details.name).toBeDefined();
    expect(res.body.details.email).toBeDefined();
    expect(res.body.details.source).toBeDefined();
  });

  it('lists, searches and filters leads', async () => {
    await request(app)
      .post('/api/leads')
      .set(auth(salesToken))
      .send({ ...validLead, name: 'Ravi Kumar', email: 'ravi@globex.com', status: 'Qualified' });

    const search = await request(app).get('/api/leads?search=ravi').set(auth(salesToken));
    expect(search.body.data).toHaveLength(1);
    expect(search.body.data[0].name).toBe('Ravi Kumar');

    const filter = await request(app).get('/api/leads?status=Qualified').set(auth(salesToken));
    expect(filter.body.data.every((lead) => lead.status === 'Qualified')).toBe(true);
  });

  it('updates a lead status', async () => {
    const created = await request(app).post('/api/leads').set(auth(salesToken)).send(validLead);
    const res = await request(app)
      .put(`/api/leads/${created.body.id}`)
      .set(auth(salesToken))
      .send({ ...validLead, status: 'Contacted' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Contacted');
  });

  it('deletes a lead, then returns 404 for it', async () => {
    const created = await request(app).post('/api/leads').set(auth(salesToken)).send(validLead);
    const del = await request(app).delete(`/api/leads/${created.body.id}`).set(auth(salesToken));
    expect(del.status).toBe(204);
    const again = await request(app).delete(`/api/leads/${created.body.id}`).set(auth(salesToken));
    expect(again.status).toBe(404);
  });

  it('returns correct dashboard counts', async () => {
    const res = await request(app).get('/api/leads/stats').set(auth(otherToken));
    expect(res.body.total).toBe(0);
  });
});

describe('who can see which leads', () => {
  it('hides a lead from another sales user', async () => {
    const created = await request(app).post('/api/leads').set(auth(salesToken)).send(validLead);

    const list = await request(app).get('/api/leads').set(auth(otherToken));
    expect(list.body.data).toHaveLength(0);

    const one = await request(app).get(`/api/leads/${created.body.id}`).set(auth(otherToken));
    expect(one.status).toBe(404);

    const del = await request(app).delete(`/api/leads/${created.body.id}`).set(auth(otherToken));
    expect(del.status).toBe(404);
  });

  it('lets the manager see everyone\'s leads', async () => {
    const res = await request(app).get('/api/leads?limit=100').set(auth(managerToken));
    expect(res.body.pagination.total).toBeGreaterThan(0);
    expect(res.body.data[0].owner_name).toBeDefined();
  });
});