// End-to-end check of every endpoint against a running stack: `docker compose up -d --build --wait && npm run test:e2e`
import assert from 'node:assert/strict';
import { test } from 'node:test';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

const call = async (
  method: string,
  path: string,
  { token, body }: { token?: string; body?: unknown } = {},
) => {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return {
    status: res.status,
    headers: res.headers,
    body: (res.status === 204 ? null : await res.json()) as Json,
  };
};

const newUser = async () => {
  const email = `u${Date.now()}${Math.random().toString(36).slice(2, 6)}@test.com`;
  const r = await call('POST', '/api/auth/register/', {
    body: { name: 'Test', email, password: 'password123' },
  });
  assert.equal(r.status, 201);
  assert.equal(r.body.user.password, undefined, 'password hash must not leak');
  return { email, token: r.body.accessToken as string, refreshToken: r.body.refreshToken as string };
};

test('full API flow', async () => {
  const { email, token, refreshToken } = await newUser();

  // auth
  const dup = await call('POST', '/api/auth/register/', {
    body: { name: 'X', email, password: 'password123' },
  });
  assert.equal(dup.status, 409);
  const invalid = await call('POST', '/api/auth/register/', {
    body: { name: 'X', email: 'bad', password: '1' },
  });
  assert.equal(invalid.status, 400);
  assert.equal(invalid.body.error.code, 'VALIDATION_ERROR');
  assert.ok(invalid.body.error.details.length >= 2);
  assert.equal(
    (await call('POST', '/api/auth/login/', { body: { email, password: 'wrong-pass' } })).status,
    401,
  );
  const login = await call('POST', '/api/auth/login/', {
    body: { email: email.toUpperCase(), password: 'password123' },
  });
  assert.equal(login.status, 200);
  assert.ok(login.body.accessToken && login.body.refreshToken);
  const refreshed = await call('POST', '/api/auth/refresh/', { body: { refreshToken } });
  assert.equal(refreshed.status, 200);
  assert.ok(refreshed.body.accessToken);
  assert.equal(
    (await call('GET', '/api/patients/', { token: refreshToken })).status,
    401,
    'refresh token is not an access token',
  );
  assert.equal((await call('GET', '/api/patients/')).status, 401);
  assert.equal((await call('GET', '/api/patients/', { token: 'garbage' })).status, 401);

  // patients
  assert.equal(
    (await call('POST', '/api/patients/', { token, body: { name: 'P', age: -1, gender: 'x' } })).status,
    400,
  );
  const p = await call('POST', '/api/patients/', {
    token,
    body: { name: 'Jane', age: 40, gender: 'female' },
  });
  assert.equal(p.status, 201);
  const pid = p.body.id;
  assert.equal((await call('GET', '/api/patients/', { token })).body.data.length, 1);
  assert.equal((await call('GET', `/api/patients/${pid}/`, { token })).body.name, 'Jane');
  assert.equal((await call('PUT', `/api/patients/${pid}/`, { token, body: { age: 41 } })).body.age, 41);
  assert.equal((await call('PUT', `/api/patients/${pid}/`, { token, body: {} })).status, 400);
  assert.equal((await call('GET', '/api/patients/abc/', { token })).status, 400);

  // pagination
  for (const name of ['Second', 'Third']) {
    await call('POST', '/api/patients/', { token, body: { name, age: 30, gender: 'other' } });
  }
  const page2 = await call('GET', '/api/patients/?limit=2&page=2', { token });
  assert.equal(page2.status, 200);
  assert.deepEqual(page2.body.meta, { page: 2, limit: 2, total: 3, totalPages: 2 });
  assert.equal(page2.body.data[0].name, 'Third');
  assert.equal((await call('GET', '/api/patients/', { token })).body.meta.limit, 20);
  assert.equal((await call('GET', '/api/patients/?limit=500', { token })).status, 400);
  assert.equal((await call('GET', '/api/patients/?page=0', { token })).status, 400);

  // another user cannot see or touch this patient
  const other = await newUser();
  assert.equal((await call('GET', '/api/patients/', { token: other.token })).body.data.length, 0);
  assert.equal((await call('GET', `/api/patients/${pid}/`, { token: other.token })).status, 404);
  assert.equal((await call('DELETE', `/api/patients/${pid}/`, { token: other.token })).status, 404);

  // doctors
  const d = await call('POST', '/api/doctors/', {
    token,
    body: { name: 'Dr. Rao', specialization: 'Cardiology' },
  });
  assert.equal(d.status, 201);
  const did = d.body.id;
  // doctors are shared and ordered by id, so the newest one is on the last page
  const { total } = (await call('GET', '/api/doctors/?limit=1', { token: other.token })).body.meta;
  const last = await call('GET', `/api/doctors/?limit=1&page=${total}`, { token: other.token });
  assert.equal(last.body.data[0].id, did);
  assert.equal((await call('GET', `/api/doctors/${did}/`, { token })).status, 200);
  assert.equal(
    (await call('PUT', `/api/doctors/${did}/`, { token, body: { experienceYears: 10 } })).body
      .experienceYears,
    10,
  );
  assert.equal(
    (await call('PUT', `/api/doctors/${did}/`, { token: other.token, body: { name: 'Hijack' } })).status,
    403,
  );

  // mappings
  const m = await call('POST', '/api/mappings/', { token, body: { patientId: pid, doctorId: did } });
  assert.equal(m.status, 201);
  assert.equal(
    (await call('POST', '/api/mappings/', { token, body: { patientId: pid, doctorId: did } })).status,
    409,
  );
  assert.equal(
    (await call('POST', '/api/mappings/', { token: other.token, body: { patientId: pid, doctorId: did } }))
      .status,
    404,
  );
  const all = await call('GET', '/api/mappings/', { token });
  assert.equal(all.body.data.length, 1);
  assert.equal(all.body.data[0].patient.name, 'Jane');
  assert.equal(all.body.data[0].doctor.id, did);
  assert.equal((await call('GET', '/api/mappings/', { token: other.token })).body.data.length, 0);
  const byPatient = await call('GET', `/api/mappings/${pid}/`, { token });
  assert.equal(byPatient.body.doctors[0].id, did);
  assert.equal(byPatient.body.doctors[0].mappingId, m.body.id);
  assert.equal((await call('DELETE', `/api/mappings/${m.body.id}/`, { token: other.token })).status, 404);
  assert.equal((await call('DELETE', `/api/mappings/${m.body.id}/`, { token })).status, 204);
  assert.equal((await call('GET', `/api/mappings/${pid}/`, { token })).body.doctors.length, 0);

  // deletes
  assert.equal((await call('DELETE', `/api/doctors/${did}/`, { token })).status, 204);
  assert.equal((await call('DELETE', `/api/patients/${pid}/`, { token })).status, 204);
  assert.equal((await call('GET', `/api/patients/${pid}/`, { token })).status, 404);

  // platform
  const health = await call('GET', '/health');
  assert.equal(health.body.database, 'up');
  assert.ok(health.headers.get('x-request-id'));
  assert.equal(health.headers.get('x-powered-by'), null);
  assert.equal((await call('GET', '/api/docs.json')).status, 200);
  assert.equal((await call('GET', '/api/nope')).body.error.code, 'NOT_FOUND');
});
