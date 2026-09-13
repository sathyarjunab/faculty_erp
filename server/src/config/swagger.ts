import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';
import config from './env';

/**
 * OpenAPI definition. Path/operation docs live as JSDoc @openapi blocks
 * next to each route file and are merged in via the `apis` glob below.
 */
const definition = {
  openapi: '3.0.3',
  info: {
    title: 'Faculty Academic Management System API',
    version: '1.0.0',
    description:
      'REST API for teachers to manage classrooms, subjects, exams and student marks. ' +
      'Built with Express + Sequelize (MySQL) in TypeScript using a factory-pattern architecture.',
  },
  servers: [{ url: `http://localhost:${config.port}`, description: 'Local server' }],
  tags: [
    { name: 'Auth', description: 'Signup, login (password / OTP / Google), token refresh' },
    { name: 'Profile', description: 'Current teacher profile' },
    { name: 'Dashboard', description: 'Analytics, KPIs and the score-change log' },
    { name: 'Classrooms', description: 'Class-sections and subjects the teacher handles' },
    { name: 'Marks', description: 'Exam selection, marks entry and Excel export' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      SuccessEnvelope: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'OK' },
          data: { type: 'object', nullable: true },
        },
      },
      ErrorEnvelope: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Resource not found' },
          details: { type: 'object', nullable: true },
        },
      },
      Teacher: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Anita Sharma' },
          email: { type: 'string', example: 'anita@school.edu' },
          dept: { type: 'string', nullable: true, example: 'Mathematics' },
          photoUrl: { type: 'string', nullable: true },
          emailVerified: { type: 'boolean', example: true },
          hasPassword: { type: 'boolean', example: true },
          hasGoogle: { type: 'boolean', example: false },
        },
      },
      AuthTokens: {
        type: 'object',
        properties: {
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
          teacher: { $ref: '#/components/schemas/Teacher' },
        },
      },
      Classroom: {
        type: 'object',
        properties: {
          sectionId: { type: 'integer', example: 3 },
          className: { type: 'string', example: 'Grade 10' },
          sectionName: { type: 'string', example: 'B' },
          classId: { type: 'integer', example: 2 },
          subjectCount: { type: 'integer', example: 2 },
          studentCount: { type: 'integer', example: 34 },
        },
      },
      Exam: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 4 },
          name: { type: 'string', example: 'Mid Term' },
          sequence: { type: 'integer', example: 2 },
          maxMarks: { type: 'integer', example: 50 },
        },
      },
      StudentMark: {
        type: 'object',
        properties: {
          enrollmentId: { type: 'integer', example: 51 },
          studentId: { type: 'integer', example: 20 },
          rollNo: { type: 'string', example: '10B-04' },
          studentName: { type: 'string', example: 'Rahul Verma' },
          markId: { type: 'integer', nullable: true, example: 120 },
          score: { type: 'number', nullable: true, example: 42 },
          isAbsent: { type: 'boolean', example: false },
          percentage: { type: 'number', nullable: true, example: 84 },
          grade: { type: 'string', nullable: true, example: 'A' },
          status: { type: 'string', nullable: true, example: 'Pass' },
        },
      },
      MarkInput: {
        type: 'object',
        required: ['enrollmentId'],
        properties: {
          enrollmentId: { type: 'integer', example: 51 },
          score: { type: 'number', nullable: true, example: 42 },
          isAbsent: { type: 'boolean', example: false },
        },
      },
      ScoreChangeLog: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 900 },
          studentName: { type: 'string', example: 'Rahul Verma' },
          subjectName: { type: 'string', example: 'Mathematics' },
          examName: { type: 'string', example: 'Mid Term' },
          oldScore: { type: 'number', nullable: true, example: 38 },
          newScore: { type: 'number', nullable: true, example: 42 },
          action: { type: 'string', enum: ['create', 'update'], example: 'update' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: 'Missing or invalid access token',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } },
      },
      NotFound: {
        description: 'Resource not found',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } },
      },
      ValidationError: {
        description: 'Request validation failed',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } },
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

// Scan compiled JS (dist) in production, TS sources in dev; forward slashes for Windows glob.
const isTs = __filename.endsWith('.ts');
const routesGlob = path
  .join(__dirname, '..', 'routes', isTs ? '*.ts' : '*.js')
  .replace(/\\/g, '/');

const swaggerSpec = swaggerJsdoc({
  definition,
  apis: [routesGlob],
});

export default swaggerSpec;
