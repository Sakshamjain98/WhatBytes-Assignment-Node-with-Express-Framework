// End-to-end check against a running server: `docker compose up -d && npm test`
const { test } = require('node:test');
const assert = require('node:assert/strict');

const BASE = process.env.BASE_URL || 'http://localhost:3000';

const call = async (method, path, { token, body } = {}) => {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body && JSON.stringify(body),
  });
  return { status: res.status, body: res.status === 204 ? null : await res.json() };
};

const newUser = async () => {
  const email = `u${Date.now()}${Math.random().toString(36).slice(2, 6)}@test.com`;
  const r = await call('POST', '/api/auth/register/', { body: { name: 'Test', email, password: 'password123' } });
  assert.equal(r.status, 201);
  assert.equal(r.body.user.password, undefined, 'password hash must not leak');
  return { email, token: r.body.token };
};

test('full API flow', async () => {
  const { email, token } = await newUser();

  // auth
  assert.equal((await call('POST', '/api/auth/register/', { body: { name: 'X', email, password: 'password123' } })).status, 409);
  assert.equal((await call('POST', '/api/auth/register/', { body: { name: 'X', email: 'bad', password: '1' } })).status, 400);
  assert.equal((await call('POST', '/api/auth/login/', { body: { email, password: 'wrong-pass' } })).status, 401);
  const login = await call('POST', '/api/auth/login/', { body: { email: email.toUpperCase(), password: 'password123' } });
  assert.equal(login.status, 200);
  assert.ok(login.body.token);
  assert.equal((await call('GET', '/api/patients/')).status, 401);
  assert.equal((await call('GET', '/api/patients/', { token: 'garbage' })).status, 401);

  // patients
  assert.equal((await call('POST', '/api/patients/', { token, body: { name: 'P', age: -1, gender: 'x' } })).status, 400);
  const p = await call('POST', '/api/patients/', { token, body: { name: 'Jane', age: 40, gender: 'female' } });
  assert.equal(p.status, 201);
  const pid = p.body.id;
  assert.equal((await call('GET', '/api/patients/', { token })).body.length, 1);
  assert.equal((await call('GET', `/api/patients/${pid}/`, { token })).body.name, 'Jane');
  assert.equal((await call('PUT', `/api/patients/${pid}/`, { token, body: { age: 41 } })).body.age, 41);
  assert.equal((await call('GET', '/api/patients/abc/', { token })).status, 400);

  // another user cannot see or touch this patient
  const other = await newUser();
  assert.equal((await call('GET', '/api/patients/', { token: other.token })).body.length, 0);
  assert.equal((await call('GET', `/api/patients/${pid}/`, { token: other.token })).status, 404);
  assert.equal((await call('DELETE', `/api/patients/${pid}/`, { token: other.token })).status, 404);

  // doctors
  const d = await call('POST', '/api/doctors/', { token, body: { name: 'Dr. Rao', specialization: 'Cardiology' } });
  assert.equal(d.status, 201);
  const did = d.body.id;
  assert.ok((await call('GET', '/api/doctors/', { token: other.token })).body.some((x) => x.id === did));
  assert.equal((await call('GET', `/api/doctors/${did}/`, { token })).status, 200);
  assert.equal((await call('PUT', `/api/doctors/${did}/`, { token, body: { experienceYears: 10 } })).body.experienceYears, 10);
  assert.equal((await call('PUT', `/api/doctors/${did}/`, { token: other.token, body: { name: 'Hijack' } })).status, 403);

  // mappings
  const m = await call('POST', '/api/mappings/', { token, body: { patientId: pid, doctorId: did } });
  assert.equal(m.status, 201);
  assert.equal((await call('POST', '/api/mappings/', { token, body: { patientId: pid, doctorId: did } })).status, 409);
  assert.equal((await call('POST', '/api/mappings/', { token: other.token, body: { patientId: pid, doctorId: did } })).status, 404);
  assert.equal((await call('GET', '/api/mappings/', { token })).body.length, 1);
  assert.equal((await call('GET', '/api/mappings/', { token: other.token })).body.length, 0);
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

  // docs + unknown route
  assert.equal((await call('GET', '/api/docs.json')).status, 200);
  assert.equal((await call('GET', '/api/nope')).status, 404);
});
