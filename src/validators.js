const { z } = require('zod');

const text = (max) => z.string().trim().min(1).max(max);

exports.id = z.coerce.number().int().positive();

exports.register = z.object({
  name: text(100),
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(8).max(128),
});

exports.login = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

exports.patient = z.object({
  name: text(100),
  age: z.number().int().min(0).max(150),
  gender: z.enum(['male', 'female', 'other']),
  phone: text(20).optional(),
  address: text(255).optional(),
  medicalHistory: z.string().trim().max(5000).optional(),
}).strict();

exports.doctor = z.object({
  name: text(100),
  specialization: text(100),
  email: z.string().trim().toLowerCase().email().max(255).optional(),
  phone: text(20).optional(),
  experienceYears: z.number().int().min(0).max(80).optional(),
}).strict();

exports.mapping = z.object({
  patientId: exports.id,
  doctorId: exports.id,
}).strict();
