type Schema = Record<string, unknown>;

const ref = (name: string): Schema => ({ $ref: `#/components/schemas/${name}` });
const json = (schema: Schema) => ({ content: { 'application/json': { schema } } });
const ok = (description: string, schema: Schema) => ({ description, ...json(schema) });
const err = (description: string) => ok(description, ref('ErrorResponse'));
const idParam = (description: string) => ({
  name: 'id',
  in: 'path',
  required: true,
  description,
  schema: { type: 'integer', minimum: 1 },
});
const arrayOf = (name: string): Schema => ({ type: 'array', items: ref(name) });
const paginated = (name: string): Schema => ({
  type: 'object',
  properties: { data: arrayOf(name), meta: ref('PaginationMeta') },
});
const pageParams = [
  {
    name: 'page',
    in: 'query',
    description: 'Page number',
    schema: { type: 'integer', minimum: 1, default: 1 },
  },
  {
    name: 'limit',
    in: 'query',
    description: 'Items per page',
    schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
  },
];

const E400 = err('Validation failed');
const E401 = err('Missing, invalid or expired access token');
const E404 = err('Not found');
const E429 = err('Too many requests');

const readOnly = {
  id: { type: 'integer', readOnly: true },
  createdBy: { type: 'integer', readOnly: true },
  createdAt: { type: 'string', format: 'date-time', readOnly: true },
  updatedAt: { type: 'string', format: 'date-time', readOnly: true },
};

const patientFields = {
  name: { type: 'string', maxLength: 100, example: 'Jane Doe' },
  age: { type: 'integer', minimum: 0, maximum: 150, example: 42 },
  gender: { type: 'string', enum: ['male', 'female', 'other'] },
  phone: { type: 'string', maxLength: 20, example: '+91-9876543210', nullable: true },
  address: { type: 'string', maxLength: 255, example: 'Bengaluru', nullable: true },
  medicalHistory: { type: 'string', maxLength: 5000, example: 'Type 2 diabetes', nullable: true },
};

const doctorFields = {
  name: { type: 'string', maxLength: 100, example: 'Dr. Asha Rao' },
  specialization: { type: 'string', maxLength: 100, example: 'Cardiology' },
  email: { type: 'string', format: 'email', example: 'asha.rao@clinic.com', nullable: true },
  phone: { type: 'string', maxLength: 20, example: '+91-9123456780', nullable: true },
  experienceYears: { type: 'integer', minimum: 0, maximum: 80, example: 12, nullable: true },
};

const crud = (tag: string, entity: string, listSummary: string, ownerOnlyWrites: boolean) => {
  const forbidden = ownerOnlyWrites ? { 403: err('Only the creator can modify this resource') } : {};
  return {
    collection: {
      post: {
        tags: [tag],
        summary: `Create a ${entity.toLowerCase()}`,
        requestBody: { required: true, ...json(ref(`Create${entity}Request`)) },
        responses: { 201: ok('Created', ref(entity)), 400: E400, 401: E401 },
      },
      get: {
        tags: [tag],
        summary: listSummary,
        parameters: pageParams,
        responses: { 200: ok('OK', paginated(entity)), 400: E400, 401: E401 },
      },
    },
    item: {
      parameters: [idParam(`${entity} id`)],
      get: {
        tags: [tag],
        summary: `Get a ${entity.toLowerCase()}`,
        responses: { 200: ok('OK', ref(entity)), 400: E400, 401: E401, 404: E404 },
      },
      put: {
        tags: [tag],
        summary: `Update a ${entity.toLowerCase()} (any subset of fields)`,
        requestBody: { required: true, ...json(ref(`Update${entity}Request`)) },
        responses: { 200: ok('Updated', ref(entity)), 400: E400, 401: E401, ...forbidden, 404: E404 },
      },
      delete: {
        tags: [tag],
        summary: `Delete a ${entity.toLowerCase()}`,
        responses: { 204: { description: 'Deleted' }, 401: E401, ...forbidden, 404: E404 },
      },
    },
  };
};

const patients = crud('Patients', 'Patient', 'List patients created by the current user', false);
const doctors = crud('Doctors', 'Doctor', 'List all doctors', true);

export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Healthcare Backend API',
    version: '1.0.0',
    description:
      'Register or log in, click **Authorize** and paste the `accessToken`. Access tokens are short-lived; ' +
      'exchange the `refreshToken` at `/api/auth/refresh/` for a new pair.',
  },
  servers: [{ url: '/' }],
  tags: [{ name: 'Auth' }, { name: 'Patients' }, { name: 'Doctors' }, { name: 'Mappings' }],
  security: [{ bearerAuth: [] }],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      PaginationMeta: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
          total: { type: 'integer', example: 42 },
          totalPages: { type: 'integer', example: 3 },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string', example: 'Validation failed' },
              details: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: { field: { type: 'string' }, message: { type: 'string' } },
                },
              },
            },
          },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', maxLength: 100, example: 'Saksham' },
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          password: { type: 'string', minLength: 8, maxLength: 72, example: 'password123' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          password: { type: 'string', example: 'password123' },
        },
      },
      RefreshRequest: {
        type: 'object',
        required: ['refreshToken'],
        properties: { refreshToken: { type: 'string' } },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          email: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      AuthTokens: {
        type: 'object',
        properties: {
          tokenType: { type: 'string', example: 'Bearer' },
          accessToken: { type: 'string' },
          accessTokenExpiresIn: { type: 'string', example: '15m' },
          refreshToken: { type: 'string' },
          refreshTokenExpiresIn: { type: 'string', example: '7d' },
        },
      },
      AuthResponse: { allOf: [ref('AuthTokens'), { type: 'object', properties: { user: ref('User') } }] },
      CreatePatientRequest: {
        type: 'object',
        required: ['name', 'age', 'gender'],
        properties: patientFields,
      },
      UpdatePatientRequest: { type: 'object', minProperties: 1, properties: patientFields },
      Patient: { type: 'object', properties: { ...readOnly, ...patientFields } },
      CreateDoctorRequest: { type: 'object', required: ['name', 'specialization'], properties: doctorFields },
      UpdateDoctorRequest: { type: 'object', minProperties: 1, properties: doctorFields },
      Doctor: { type: 'object', properties: { ...readOnly, ...doctorFields } },
      CreateMappingRequest: {
        type: 'object',
        required: ['patientId', 'doctorId'],
        properties: { patientId: { type: 'integer', example: 1 }, doctorId: { type: 'integer', example: 1 } },
      },
      PatientSummary: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' } } },
      Mapping: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          patientId: { type: 'integer' },
          doctorId: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
          patient: ref('PatientSummary'),
          doctor: ref('Doctor'),
        },
      },
      AssignedDoctor: {
        allOf: [
          ref('Doctor'),
          {
            type: 'object',
            properties: {
              mappingId: { type: 'integer' },
              assignedAt: { type: 'string', format: 'date-time' },
            },
          },
        ],
      },
      PatientDoctors: {
        type: 'object',
        properties: { patient: ref('PatientSummary'), doctors: arrayOf('AssignedDoctor') },
      },
    },
  },
  paths: {
    '/api/auth/register/': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        security: [],
        requestBody: { required: true, ...json(ref('RegisterRequest')) },
        responses: {
          201: ok('Registered', ref('AuthResponse')),
          400: E400,
          409: err('Email is already registered'),
          429: E429,
        },
      },
    },
    '/api/auth/login/': {
      post: {
        tags: ['Auth'],
        summary: 'Log in and receive JWT access + refresh tokens',
        security: [],
        requestBody: { required: true, ...json(ref('LoginRequest')) },
        responses: {
          200: ok('Logged in', ref('AuthResponse')),
          400: E400,
          401: err('Invalid email or password'),
          429: E429,
        },
      },
    },
    '/api/auth/refresh/': {
      post: {
        tags: ['Auth'],
        summary: 'Exchange a refresh token for a new token pair',
        security: [],
        requestBody: { required: true, ...json(ref('RefreshRequest')) },
        responses: { 200: ok('New tokens', ref('AuthTokens')), 400: E400, 401: E401, 429: E429 },
      },
    },
    '/api/patients/': patients.collection,
    '/api/patients/{id}/': patients.item,
    '/api/doctors/': doctors.collection,
    '/api/doctors/{id}/': doctors.item,
    '/api/mappings/': {
      post: {
        tags: ['Mappings'],
        summary: 'Assign a doctor to a patient',
        requestBody: { required: true, ...json(ref('CreateMappingRequest')) },
        responses: {
          201: ok('Assigned', ref('Mapping')),
          400: E400,
          401: E401,
          404: err('Patient or doctor not found'),
          409: err('Doctor is already assigned to this patient'),
        },
      },
      get: {
        tags: ['Mappings'],
        summary: "List all mappings for the current user's patients",
        parameters: pageParams,
        responses: { 200: ok('OK', paginated('Mapping')), 400: E400, 401: E401 },
      },
    },
    // GET takes a patient id, DELETE a mapping id (same URL shape, as per the assignment spec).
    '/api/mappings/{id}/': {
      get: {
        tags: ['Mappings'],
        summary: 'Get all doctors assigned to a patient',
        parameters: [idParam('Patient id')],
        responses: { 200: ok('OK', ref('PatientDoctors')), 400: E400, 401: E401, 404: E404 },
      },
      delete: {
        tags: ['Mappings'],
        summary: 'Remove a doctor from a patient',
        parameters: [idParam('Mapping id')],
        responses: { 204: { description: 'Removed' }, 400: E400, 401: E401, 404: E404 },
      },
    },
  },
};
