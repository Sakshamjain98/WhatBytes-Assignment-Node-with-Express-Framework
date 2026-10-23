import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ForbiddenError, NotFoundError } from '../../common/errors/app-error';
import type { Doctor } from './doctor.model';
import type { DoctorRepository } from './doctor.repository';
import { DoctorService } from './doctor.service';

const doctor = { id: 3, name: 'Dr. Rao', specialization: 'Cardiology', createdBy: 7 } as Doctor;

const serviceWith = (found: Doctor | null) => {
  const calls: string[] = [];
  const repo = {
    findById: async () => found,
    updateById: async () => (calls.push('update'), { ...doctor, experienceYears: 5 }),
    deleteById: async () => (calls.push('delete'), true),
  };
  return { service: new DoctorService(repo as unknown as DoctorRepository), calls };
};

describe('DoctorService', () => {
  it('lets the creator update and delete', async () => {
    const { service, calls } = serviceWith(doctor);
    assert.equal((await service.update(7, 3, { experienceYears: 5 })).experienceYears, 5);
    await service.remove(7, 3);
    assert.deepEqual(calls, ['update', 'delete']);
  });

  it('forbids other users from modifying', async () => {
    const { service, calls } = serviceWith(doctor);
    await assert.rejects(service.update(8, 3, { name: 'X' }), ForbiddenError);
    await assert.rejects(service.remove(8, 3), ForbiddenError);
    assert.deepEqual(calls, []);
  });

  it('throws NotFound for unknown doctors', async () => {
    const { service } = serviceWith(null);
    await assert.rejects(service.get(3), NotFoundError);
    await assert.rejects(service.update(7, 3, { name: 'X' }), NotFoundError);
  });
});
