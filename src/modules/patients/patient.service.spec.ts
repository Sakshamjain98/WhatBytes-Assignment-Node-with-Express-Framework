import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { NotFoundError } from '../../common/errors/app-error';
import type { Patient } from './patient.model';
import type { PatientRepository } from './patient.repository';
import { PatientService } from './patient.service';

const patient = (overrides: Partial<Patient> = {}) =>
  ({ id: 1, name: 'Jane', age: 40, gender: 'female', createdBy: 7, ...overrides }) as Patient;

describe('PatientService', () => {
  it('stamps the owner on create', async () => {
    let saved: unknown;
    const repo = { create: async (data: unknown) => ((saved = data), patient()) };
    const service = new PatientService(repo as unknown as PatientRepository);

    await service.create(7, { name: 'Jane', age: 40, gender: 'female' });

    assert.deepEqual(saved, { name: 'Jane', age: 40, gender: 'female', createdBy: 7 });
  });

  it('maps optional fields to null in the response', async () => {
    const repo = { findByIdAndOwner: async () => patient() };
    const result = await new PatientService(repo as unknown as PatientRepository).get(7, 1);
    assert.equal(result.phone, null);
    assert.equal(result.medicalHistory, null);
  });

  it('passes the page window to the repository and builds pagination meta', async () => {
    let window: unknown;
    const repo = {
      findAllByOwner: async (_owner: number, page: unknown) => (
        (window = page),
        { rows: [patient()], count: 41 }
      ),
    };
    const result = await new PatientService(repo as unknown as PatientRepository).list(7, {
      page: 3,
      limit: 20,
    });

    assert.deepEqual(window, { limit: 20, offset: 40 });
    assert.equal(result.data.length, 1);
    assert.deepEqual(result.meta, { page: 3, limit: 20, total: 41, totalPages: 3 });
  });

  it('throws NotFound when the patient is missing or owned by someone else', async () => {
    const repo = {
      findByIdAndOwner: async () => null,
      updateByIdAndOwner: async () => null,
      deleteByIdAndOwner: async () => false,
    };
    const service = new PatientService(repo as unknown as PatientRepository);

    await assert.rejects(service.get(7, 1), NotFoundError);
    await assert.rejects(service.update(7, 1, { age: 1 }), NotFoundError);
    await assert.rejects(service.remove(7, 1), NotFoundError);
  });
});
