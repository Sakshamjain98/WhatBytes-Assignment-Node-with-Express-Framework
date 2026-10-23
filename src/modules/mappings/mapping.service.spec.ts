import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ConflictError, NotFoundError } from '../../common/errors/app-error';
import type { DoctorRepository } from '../doctors/doctor.repository';
import type { PatientRepository } from '../patients/patient.repository';
import type { MappingRepository } from './mapping.repository';
import { MappingService } from './mapping.service';

const build = ({ patient = true, doctor = true, exists = false } = {}) => {
  const created: unknown[] = [];
  const mappings = {
    exists: async () => exists,
    create: async (data: { patientId: number; doctorId: number }) => (created.push(data), { id: 1, ...data }),
  };
  const patients = { findByIdAndOwner: async () => (patient ? { id: 1, name: 'Jane' } : null) };
  const doctors = { findById: async () => (doctor ? { id: 2 } : null) };
  const service = new MappingService(
    mappings as unknown as MappingRepository,
    patients as unknown as PatientRepository,
    doctors as unknown as DoctorRepository,
  );
  return { service, created };
};

describe('MappingService.assign', () => {
  it('creates a mapping for an owned patient and existing doctor', async () => {
    const { service, created } = build();
    const result = await service.assign(7, { patientId: 1, doctorId: 2 });
    assert.equal(result.id, 1);
    assert.deepEqual(created, [{ patientId: 1, doctorId: 2 }]);
  });

  it("rejects another user's patient or a missing doctor", async () => {
    await assert.rejects(
      build({ patient: false }).service.assign(7, { patientId: 1, doctorId: 2 }),
      NotFoundError,
    );
    await assert.rejects(
      build({ doctor: false }).service.assign(7, { patientId: 1, doctorId: 2 }),
      NotFoundError,
    );
  });

  it('rejects a duplicate assignment', async () => {
    const { service, created } = build({ exists: true });
    await assert.rejects(service.assign(7, { patientId: 1, doctorId: 2 }), ConflictError);
    assert.equal(created.length, 0);
  });
});
