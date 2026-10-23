const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const json = (schema) => ({ content: { 'application/json': { schema } } });
const err = (description) => ({ description, ...json(ref('Error')) });
const idParam = (name = 'id', description = 'Resource id') => ({
  name, in: 'path', required: true, description, schema: { type: 'integer', minimum: 1 },
});

const E400 = err('Validation failed');
const E401 = err('Missing or invalid token');
const E404 = err('Not found');

const crud = (tag, schema, input, extra = {}) => ({
  collection: {
    post: {
      tags: [tag], summary: `Create a ${tag.toLowerCase().slice(0, -1)}`,
      requestBody: { required: true, ...json(ref(input)) },
      responses: { 201: { description: 'Created', ...json(ref(schema)) }, 400: E400, 401: E401 },
    },
    get: {
      tags: [tag], summary: extra.listSummary,
      responses: { 200: { description: 'OK', ...json({ type: 'array', items: ref(schema) }) }, 401: E401 },
    },
  },
  item: {
    parameters: [idParam()],
    get: {
      tags: [tag], summary: 'Get by id',
      responses: { 200: { description: 'OK', ...json(ref(schema)) }, 401: E401, 404: E404 },
    },
    put: {
      tags: [tag], summary: 'Update (send any subset of fields)',
      requestBody: { required: true, ...json(ref(input)) },
      responses: { 200: { description: 'Updated', ...json(ref(schema)) }, 400: E400, 401: E401, ...extra.writeErrors, 404: E404 },
    },
    delete: {
      tags: [tag], summary: 'Delete',
      responses: { 204: { description: 'Deleted' }, 401: E401, ...extra.writeErrors, 404: E404 },
    },
  },
});

const patients = crud('Patients', 'Patient', 'PatientInput', { listSummary: 'List patients created by the current user' });
const doctors = crud('Doctors', 'Doctor', 'DoctorInput', {
  listSummary: 'List all doctors',
  writeErrors: { 403: err('Only the creator can modify this doctor') },
});

const stamps = {
  id: { type: 'integer', readOnly: true },
  createdBy: { type: 'integer', readOnly: true },
  createdAt: { type: 'string', format: 'date-time', readOnly: true },
  updatedAt: { type: 'string', format: 'date-time', readOnly: true },
};

const patientFields = {
  name: { type: 'string', maxLength: 100, example: 'Jane Doe' },
  age: { type: 'integer', minimum: 0, maximum: 150, example: 42 },
  gender: { type: 'string', enum: ['male', 'female', 'other'] },
  phone: { type: 'string', maxLength: 20, example: '+91-9876543210' },
  address: { type: 'string', maxLength: 255, example: 'Bengaluru' },
  medicalHistory: { type: 'string', maxLength: 5000, example: 'Type 2 diabetes' },
};
const doctorFields = {
  name: { type: 'string', maxLength: 100, example: 'Dr. Asha Rao' },
  specialization: { type: 'string', maxLength: 100, example: 'Cardiology' },
  email: { type: 'string', format: 'email', example: 'asha.rao@clinic.com' },
  phone: { type: 'string', maxLength: 20, example: '+91-9123456780' },
  experienceYears: { type: 'integer', minimum: 0, maximum: 80, example: 12 },
};

module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'Healthcare Backend API',
    version: '1.0.0',
    description: 'Register or log in, click **Authorize** and paste the `token` to call protected endpoints.',
  },
  servers: [{ url: '/' }],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          details: { type: 'array', items: { type: 'object', properties: { field: { type: 'string' }, message: { type: 'string' } } } },
        },
      },
      User: {
        type: 'object',
        properties: { id: { type: 'integer' }, name: { type: 'string' }, email: { type: 'string' }, createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' } },
      },
      AuthResponse: {
        type: 'object',
        properties: { user: ref('User'), token: { type: 'string' }, expiresIn: { type: 'string', example: '1d' } },
      },
      PatientInput: { type: 'object', required: ['name', 'age', 'gender'], properties: patientFields },
      Patient: { type: 'object', properties: { ...stamps, ...patientFields } },
      DoctorInput: { type: 'object', required: ['name', 'specialization'], properties: doctorFields },
      Doctor: { type: 'object', properties: { ...stamps, ...doctorFields } },
      MappingInput: {
        type: 'object', required: ['patientId', 'doctorId'],
        properties: { patientId: { type: 'integer', example: 1 }, doctorId: { type: 'integer', example: 1 } },
      },
      Mapping: {
        type: 'object',
        properties: {
          id: { type: 'integer' }, patientId: { type: 'integer' }, doctorId: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' },
          Patient: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' } } },
          Doctor: ref('Doctor'),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/api/auth/register/': {
      post: {
        tags: ['Auth'], summary: 'Register a new user', security: [],
        requestBody: {
          required: true,
          ...json({
            type: 'object', required: ['name', 'email', 'password'],
            properties: {
              name: { type: 'string', example: 'Saksham' },
              email: { type: 'string', format: 'email', example: 'user@example.com' },
              password: { type: 'string', minLength: 8, example: 'password123' },
            },
          }),
        },
        responses: { 201: { description: 'Registered', ...json(ref('AuthResponse')) }, 400: E400, 409: err('Email already registered') },
      },
    },
    '/api/auth/login/': {
      post: {
        tags: ['Auth'], summary: 'Log in and receive a JWT', security: [],
        requestBody: {
          required: true,
          ...json({
            type: 'object', required: ['email', 'password'],
            properties: { email: { type: 'string', format: 'email', example: 'user@example.com' }, password: { type: 'string', example: 'password123' } },
          }),
        },
        responses: { 200: { description: 'Logged in', ...json(ref('AuthResponse')) }, 400: E400, 401: err('Invalid email or password') },
      },
    },
    '/api/patients/': patients.collection,
    '/api/patients/{id}/': patients.item,
    '/api/doctors/': doctors.collection,
    '/api/doctors/{id}/': doctors.item,
    '/api/mappings/': {
      post: {
        tags: ['Mappings'], summary: 'Assign a doctor to a patient',
        requestBody: { required: true, ...json(ref('MappingInput')) },
        responses: {
          201: { description: 'Assigned', ...json(ref('Mapping')) }, 400: E400, 401: E401,
          404: err('Patient or doctor not found'), 409: err('Doctor already assigned to this patient'),
        },
      },
      get: {
        tags: ['Mappings'], summary: "List all mappings for the current user's patients",
        responses: { 200: { description: 'OK', ...json({ type: 'array', items: ref('Mapping') }) }, 401: E401 },
      },
    },
    // GET takes a patient id, DELETE a mapping id (same URL shape, as per the assignment spec).
    '/api/mappings/{id}/': {
      get: {
        tags: ['Mappings'], summary: 'Get all doctors assigned to a patient',
        parameters: [idParam('id', 'Patient id')],
        responses: {
          200: {
            description: 'OK',
            ...json({
              type: 'object',
              properties: {
                patient: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' } } },
                doctors: {
                  type: 'array',
                  items: { allOf: [ref('Doctor'), { type: 'object', properties: { mappingId: { type: 'integer' }, assignedAt: { type: 'string', format: 'date-time' } } }] },
                },
              },
            }),
          },
          401: E401, 404: E404,
        },
      },
      delete: {
        tags: ['Mappings'], summary: 'Remove a doctor from a patient (by mapping id)',
        parameters: [idParam('id', 'Mapping id')],
        responses: { 204: { description: 'Removed' }, 401: E401, 404: E404 },
      },
    },
  },
};
