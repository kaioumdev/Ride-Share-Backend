'use strict';
const swaggerJsdoc = require('swagger-jsdoc');

// ─────────────────────────────────────────────────────────────
// BASE DEFINITION
// ─────────────────────────────────────────────────────────────
const definition = {
  openapi: '3.0.0',
  info: {
    title: 'Ubar Ride Share API',
    version: '1.0.0',
    description: [
      '## Overview',
      'The **Ubar Ride Share API** powers a full-featured ride-hailing platform.',
      'It supports two actor types — **Users** (passengers) and **Captains** (drivers) —',
      'along with real-time ride lifecycle management, geolocation, and live Socket.IO updates.',
      '',
      '## Authentication',
      'All protected endpoints require a **Bearer JWT** in the `Authorization` header:',
      '```',
      'Authorization: Bearer <your_token>',
      '```',
      'Tokens are issued by `/users/login` or `/captains/login` and expire after **24 hours**.',
      'An HTTP-only `token` cookie is also accepted automatically.',
      '',
      '## Real-Time (Socket.IO)',
      'The server exposes Socket.IO on the same port as the REST API.',
      '',
      '**Client → Server events:**',
      '| Event | Payload | Description |',
      '|---|---|---|',
      '| `join` | `{ userId, userType: "user"\\|"captain" }` | Register socket session |',
      '| `update-location-captain` | `{ userId, location: { ltd, lng } }` | Captain sends live GPS |',
      '',
      '**Server → Client events:**',
      '| Event | Description |',
      '|---|---|',
      '| `new-ride` | Sent to nearby captains when a ride is created |',
      '| `ride-confirmed` | Sent to user when a captain accepts |',
      '| `ride-started` | Sent to user when OTP is verified and ride begins |',
      '| `ride-ended` | Sent to user when captain ends the ride |',
      '| `captain-location-update` | Live GPS coordinates pushed to user during ride |',
      '',
      '## Fare Calculation',
      '| Vehicle | Base Fare | Per Km | Per Minute |',
      '|---|---|---|---|',
      '| Auto | ₹30 | ₹10 | ₹2 |',
      '| Car | ₹50 | ₹15 | ₹3 |',
      '| Moto | ₹20 | ₹8 | ₹1.5 |',
      '',
      '## Quick Start',
      '1. `POST /users/register` — create a passenger account',
      '2. `POST /captains/register` — create a driver account',
      '3. `POST /users/login` or `POST /captains/login` — get JWT token',
      '4. Click **Authorize** (lock icon) and paste the token',
      '5. Use any protected endpoint',
    ].join('\n'),
    contact: { name: 'Ubar API Support', email: 'support@ubar.dev' },
    license: { name: 'ISC' },
  },
servers: [
    { url: 'https://ride-share-backend-mauve.vercel.app', description: 'Production Server' },
    { url: 'http://localhost:5005', description: 'Local Development Server' },
],
  tags: [
    { name: 'Users',    description: 'Passenger registration, authentication & profile' },
    { name: 'Captains', description: 'Driver registration, authentication & profile' },
    { name: 'Maps',     description: 'Geocoding, routing distance/time, autocomplete' },
    { name: 'Rides',    description: 'Full ride lifecycle: create → confirm → start → end' },
  ],
  components: { securitySchemes: {}, schemas: {} },
  paths: {},
};

// ─────────────────────────────────────────────────────────────
// SECURITY SCHEMES
// ─────────────────────────────────────────────────────────────
definition.components.securitySchemes = {
  BearerAuth: {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'Paste your JWT token here (without the "Bearer " prefix — Swagger adds it automatically).',
  },
};

// ─────────────────────────────────────────────────────────────
// SHARED SCHEMAS
// ─────────────────────────────────────────────────────────────
definition.components.schemas.ValidationError = {
  type: 'object',
  properties: {
    errors: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type:     { type: 'string', example: 'field' },
          msg:      { type: 'string', example: 'Invalid Email' },
          path:     { type: 'string', example: 'email' },
          location: { type: 'string', example: 'body' },
        },
      },
    },
  },
};

definition.components.schemas.ErrorMessage = {
  type: 'object',
  properties: {
    message: { type: 'string', example: 'Unauthorized' },
  },
};

definition.components.schemas.LogoutResponse = {
  type: 'object',
  properties: {
    message: { type: 'string', example: 'Logged out' },
  },
};

// ─────────────────────────────────────────────────────────────
// USER SCHEMAS
// ─────────────────────────────────────────────────────────────
definition.components.schemas.UserFullname = {
  type: 'object',
  required: ['firstname'],
  properties: {
    firstname: { type: 'string', minLength: 3, example: 'John' },
    lastname:  { type: 'string', minLength: 3, example: 'Doe' },
  },
};

definition.components.schemas.User = {
  type: 'object',
  properties: {
    _id:      { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
    fullname: { $ref: '#/components/schemas/UserFullname' },
    email:    { type: 'string', format: 'email', example: 'john.doe@example.com' },
    socketId: { type: 'string', nullable: true, example: 'abc123xyz' },
  },
};

definition.components.schemas.UserRegisterRequest = {
  type: 'object',
  required: ['fullname', 'email', 'password'],
  properties: {
    fullname: { $ref: '#/components/schemas/UserFullname' },
    email:    { type: 'string', format: 'email', example: 'john.doe@example.com' },
    password: { type: 'string', minLength: 6, format: 'password', example: 'secret123' },
  },
};

definition.components.schemas.UserLoginRequest = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email:    { type: 'string', format: 'email', example: 'john.doe@example.com' },
    password: { type: 'string', minLength: 6, format: 'password', example: 'secret123' },
  },
};

definition.components.schemas.UserAuthResponse = {
  type: 'object',
  properties: {
    token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2N...' },
    user:  { $ref: '#/components/schemas/User' },
  },
};

// ─────────────────────────────────────────────────────────────
// CAPTAIN SCHEMAS
// ─────────────────────────────────────────────────────────────
definition.components.schemas.CaptainVehicle = {
  type: 'object',
  required: ['color', 'plate', 'capacity', 'vehicleType'],
  properties: {
    color:       { type: 'string', minLength: 3, example: 'White' },
    plate:       { type: 'string', minLength: 3, example: 'DL-01-AB-1234' },
    capacity:    { type: 'integer', minimum: 1, example: 4 },
    vehicleType: { type: 'string', enum: ['car', 'motorcycle', 'auto'], example: 'car' },
  },
};

definition.components.schemas.CaptainLocation = {
  type: 'object',
  properties: {
    ltd: { type: 'number', format: 'float', example: 28.6139 },
    lng: { type: 'number', format: 'float', example: 77.2090 },
  },
};

definition.components.schemas.Captain = {
  type: 'object',
  properties: {
    _id:      { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d2' },
    fullname: { $ref: '#/components/schemas/UserFullname' },
    email:    { type: 'string', format: 'email', example: 'driver.ramesh@example.com' },
    status:   { type: 'string', enum: ['active', 'inactive'], example: 'inactive' },
    vehicle:  { $ref: '#/components/schemas/CaptainVehicle' },
    location: { $ref: '#/components/schemas/CaptainLocation' },
    socketId: { type: 'string', nullable: true, example: 'sock456abc' },
  },
};

definition.components.schemas.CaptainRegisterRequest = {
  type: 'object',
  required: ['fullname', 'email', 'password', 'vehicle'],
  properties: {
    fullname: { $ref: '#/components/schemas/UserFullname' },
    email:    { type: 'string', format: 'email', example: 'driver.ramesh@example.com' },
    password: { type: 'string', minLength: 6, format: 'password', example: 'drivepass789' },
    vehicle:  { $ref: '#/components/schemas/CaptainVehicle' },
  },
};

definition.components.schemas.CaptainLoginRequest = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email:    { type: 'string', format: 'email', example: 'driver.ramesh@example.com' },
    password: { type: 'string', minLength: 6, format: 'password', example: 'drivepass789' },
  },
};

definition.components.schemas.CaptainAuthResponse = {
  type: 'object',
  properties: {
    token:   { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2N...' },
    captain: { $ref: '#/components/schemas/Captain' },
  },
};

// ─────────────────────────────────────────────────────────────
// MAPS SCHEMAS
// ─────────────────────────────────────────────────────────────
definition.components.schemas.CoordinatesResponse = {
  type: 'object',
  properties: {
    ltd: { type: 'number', format: 'float', example: 28.6139, description: 'Latitude' },
    lng: { type: 'number', format: 'float', example: 77.2090, description: 'Longitude' },
  },
};

definition.components.schemas.DistanceTimeResponse = {
  type: 'object',
  properties: {
    distance: {
      type: 'object',
      properties: {
        value: { type: 'number', example: 12540, description: 'Distance in metres' },
        text:  { type: 'string', example: '12.5 km' },
      },
    },
    duration: {
      type: 'object',
      properties: {
        value: { type: 'number', example: 1980, description: 'Duration in seconds' },
        text:  { type: 'string', example: '33 mins' },
      },
    },
  },
};

definition.components.schemas.SuggestionsResponse = {
  type: 'array',
  items: { type: 'string' },
  example: ['Connaught Place, New Delhi, India', 'Connaught Place Metro Station, New Delhi, India'],
};

// ─────────────────────────────────────────────────────────────
// RIDE SCHEMAS
// ─────────────────────────────────────────────────────────────
definition.components.schemas.FareResponse = {
  type: 'object',
  properties: {
    auto: { type: 'number', example: 85,  description: 'Fare for auto-rickshaw (INR)' },
    car:  { type: 'number', example: 145, description: 'Fare for car (INR)' },
    moto: { type: 'number', example: 65,  description: 'Fare for motorcycle (INR)' },
  },
};

definition.components.schemas.Ride = {
  type: 'object',
  properties: {
    _id:         { type: 'string', example: '64f9a1b2c3d4e5f6a7b8c9d0' },
    user:        { $ref: '#/components/schemas/User' },
    captain:     { oneOf: [{ $ref: '#/components/schemas/Captain' }, { type: 'object', nullable: true }] },
    pickup:      { type: 'string', example: 'Connaught Place, New Delhi' },
    destination: { type: 'string', example: 'India Gate, New Delhi' },
    fare:        { type: 'number', example: 145 },
    status: {
      type: 'string',
      enum: ['pending', 'accepted', 'ongoing', 'completed', 'cancelled'],
      example: 'pending',
    },
    duration:  { type: 'number', nullable: true, example: 1980,  description: 'Duration in seconds' },
    distance:  { type: 'number', nullable: true, example: 12540, description: 'Distance in metres' },
    paymentID: { type: 'string', nullable: true, example: 'pay_OFx9sK1k2o' },
    orderId:   { type: 'string', nullable: true, example: 'order_OFx9sK1k2o' },
    signature: { type: 'string', nullable: true },
  },
};

// ─────────────────────────────────────────────────────────────
// USER PATHS
// ─────────────────────────────────────────────────────────────
definition.paths['/users/register'] = {
  post: {
    tags: ['Users'],
    summary: 'Register a new passenger',
    description: 'Creates a passenger account. Returns a JWT token and user object.\n\n**Validation:** email must be valid · firstname ≥ 3 chars · password ≥ 6 chars',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/UserRegisterRequest' },
          examples: {
            minimal: {
              summary: 'First name only',
              value: { fullname: { firstname: 'John' }, email: 'john@example.com', password: 'secret123' },
            },
            full: {
              summary: 'Full name',
              value: { fullname: { firstname: 'John', lastname: 'Doe' }, email: 'john.doe@example.com', password: 'secret123' },
            },
          },
        },
      },
    },
    responses: {
      201: { description: 'User registered', content: { 'application/json': { schema: { $ref: '#/components/schemas/UserAuthResponse' } } } },
      400: {
        description: 'Validation error or duplicate email',
        content: {
          'application/json': {
            schema: { oneOf: [{ $ref: '#/components/schemas/ValidationError' }, { $ref: '#/components/schemas/ErrorMessage' }] },
            examples: { duplicate: { summary: 'Email taken', value: { message: 'User already exist' } } },
          },
        },
      },
    },
  },
};

definition.paths['/users/login'] = {
  post: {
    tags: ['Users'],
    summary: 'Authenticate a passenger',
    description: 'Returns a JWT token (24 h expiry) and sets it as an HTTP cookie `token`.',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/UserLoginRequest' },
          example: { email: 'john.doe@example.com', password: 'secret123' },
        },
      },
    },
    responses: {
      200: { description: 'Login successful', content: { 'application/json': { schema: { $ref: '#/components/schemas/UserAuthResponse' } } } },
      400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
      401: { description: 'Wrong credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' }, example: { message: 'Invalid email or password' } } } },
    },
  },
};

definition.paths['/users/profile'] = {
  get: {
    tags: ['Users'],
    summary: 'Get current user profile',
    description: 'Returns the authenticated passenger\'s profile. Requires Bearer token.',
    security: [{ BearerAuth: [] }],
    responses: {
      200: { description: 'Profile returned', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
    },
  },
};

definition.paths['/users/logout'] = {
  get: {
    tags: ['Users'],
    summary: 'Logout current user',
    description: 'Blacklists the JWT token (it cannot be reused) and clears the `token` cookie.',
    security: [{ BearerAuth: [] }],
    responses: {
      200: { description: 'Logged out', content: { 'application/json': { schema: { $ref: '#/components/schemas/LogoutResponse' } } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
    },
  },
};

// ─────────────────────────────────────────────────────────────
// CAPTAIN PATHS
// ─────────────────────────────────────────────────────────────
definition.paths['/captains/register'] = {
  post: {
    tags: ['Captains'],
    summary: 'Register a new driver (captain)',
    description: 'Creates a driver account with vehicle details.\n\n**Validation:** email · firstname ≥ 3 · password ≥ 6 · vehicle.color ≥ 3 · vehicle.plate ≥ 3 · capacity ≥ 1 · vehicleType ∈ {car, motorcycle, auto}',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/CaptainRegisterRequest' },
          example: {
            fullname: { firstname: 'Ramesh', lastname: 'Kumar' },
            email: 'ramesh.kumar@example.com',
            password: 'drivepass789',
            vehicle: { color: 'White', plate: 'DL-01-AB-1234', capacity: 4, vehicleType: 'car' },
          },
        },
      },
    },
    responses: {
      201: { description: 'Captain registered', content: { 'application/json': { schema: { $ref: '#/components/schemas/CaptainAuthResponse' } } } },
      400: {
        description: 'Validation error or duplicate email',
        content: {
          'application/json': {
            schema: { oneOf: [{ $ref: '#/components/schemas/ValidationError' }, { $ref: '#/components/schemas/ErrorMessage' }] },
            examples: { duplicate: { summary: 'Email taken', value: { message: 'Captain already exist' } } },
          },
        },
      },
    },
  },
};

definition.paths['/captains/login'] = {
  post: {
    tags: ['Captains'],
    summary: 'Authenticate a captain (driver)',
    description: 'Returns a JWT token (24 h expiry) and sets it as an HTTP cookie `token`.',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/CaptainLoginRequest' },
          example: { email: 'ramesh.kumar@example.com', password: 'drivepass789' },
        },
      },
    },
    responses: {
      200: { description: 'Login successful', content: { 'application/json': { schema: { $ref: '#/components/schemas/CaptainAuthResponse' } } } },
      400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
      401: { description: 'Wrong credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' }, example: { message: 'Invalid email or password' } } } },
    },
  },
};

definition.paths['/captains/profile'] = {
  get: {
    tags: ['Captains'],
    summary: 'Get current captain profile',
    description: 'Returns the authenticated captain\'s profile including vehicle and location. Requires Captain Bearer token.',
    security: [{ BearerAuth: [] }],
    responses: {
      200: {
        description: 'Profile returned',
        content: {
          'application/json': {
            schema: { type: 'object', properties: { captain: { $ref: '#/components/schemas/Captain' } } },
          },
        },
      },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
    },
  },
};

definition.paths['/captains/logout'] = {
  get: {
    tags: ['Captains'],
    summary: 'Logout current captain',
    description: 'Blacklists the JWT token and clears the `token` cookie.',
    security: [{ BearerAuth: [] }],
    responses: {
      200: { description: 'Logged out', content: { 'application/json': { schema: { $ref: '#/components/schemas/LogoutResponse' }, example: { message: 'Logout successfully' } } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
    },
  },
};

// ─────────────────────────────────────────────────────────────
// MAPS PATHS
// ─────────────────────────────────────────────────────────────
definition.paths['/maps/get-coordinates'] = {
  get: {
    tags: ['Maps'],
    summary: 'Geocode an address to lat/lng',
    description: 'Converts a human-readable address to coordinates via the Geoapify Geocoding API.\n\n**Auth:** User Bearer token required.',
    security: [{ BearerAuth: [] }],
    parameters: [
      { name: 'address', in: 'query', required: true, description: 'Address string (min 3 chars)', schema: { type: 'string', minLength: 3 }, example: 'Connaught Place, New Delhi' },
    ],
    responses: {
      200: { description: 'Coordinates returned', content: { 'application/json': { schema: { $ref: '#/components/schemas/CoordinatesResponse' } } } },
      400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
      404: { description: 'Address not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' }, example: { message: 'Coordinates not found' } } } },
    },
  },
};

definition.paths['/maps/get-distance-time'] = {
  get: {
    tags: ['Maps'],
    summary: 'Get driving distance and estimated time',
    description: 'Returns the driving distance (metres) and travel duration (seconds) between two addresses via Geoapify Routing API.\n\n**Auth:** User Bearer token required.',
    security: [{ BearerAuth: [] }],
    parameters: [
      { name: 'origin',      in: 'query', required: true, description: 'Starting address (min 3 chars)', schema: { type: 'string', minLength: 3 }, example: 'Connaught Place, New Delhi' },
      { name: 'destination', in: 'query', required: true, description: 'Ending address (min 3 chars)',   schema: { type: 'string', minLength: 3 }, example: 'India Gate, New Delhi' },
    ],
    responses: {
      200: { description: 'Distance and duration returned', content: { 'application/json': { schema: { $ref: '#/components/schemas/DistanceTimeResponse' } } } },
      400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
      500: { description: 'Routing API failure', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
    },
  },
};

definition.paths['/maps/get-suggestions'] = {
  get: {
    tags: ['Maps'],
    summary: 'Get address autocomplete suggestions',
    description: 'Returns up to 10 formatted address suggestions for a partial input string. Powers the live search dropdown in the frontend.\n\n**Auth:** User Bearer token required.',
    security: [{ BearerAuth: [] }],
    parameters: [
      { name: 'input', in: 'query', required: true, description: 'Partial address text (min 3 chars)', schema: { type: 'string', minLength: 3 }, example: 'Connaught' },
    ],
    responses: {
      200: { description: 'Suggestions returned', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuggestionsResponse' } } } },
      400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
      500: { description: 'Autocomplete API failure', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
    },
  },
};

// ─────────────────────────────────────────────────────────────
// RIDE PATHS
// ─────────────────────────────────────────────────────────────
definition.paths['/rides/get-fare'] = {
  get: {
    tags: ['Rides'],
    summary: 'Get fare estimate for all vehicle types',
    description: 'Calculates fares for auto, car, and moto based on real driving distance and duration between pickup and destination.\n\n**Auth:** User Bearer token required.\n\n**Fare Formula:** `base + (distance_km × per_km_rate) + (duration_min × per_min_rate)`',
    security: [{ BearerAuth: [] }],
    parameters: [
      { name: 'pickup',      in: 'query', required: true, description: 'Pickup address (min 3 chars)',      schema: { type: 'string', minLength: 3 }, example: 'Connaught Place, New Delhi' },
      { name: 'destination', in: 'query', required: true, description: 'Destination address (min 3 chars)', schema: { type: 'string', minLength: 3 }, example: 'India Gate, New Delhi' },
    ],
    responses: {
      200: { description: 'Fare estimates returned', content: { 'application/json': { schema: { $ref: '#/components/schemas/FareResponse' } } } },
      400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
      500: { description: 'Fare calculation failed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
    },
  },
};

definition.paths['/rides/create'] = {
  post: {
    tags: ['Rides'],
    summary: 'Create a new ride request',
    description: 'Creates a ride with `pending` status. The server immediately returns the ride object, then asynchronously notifies nearby captains via Socket.IO (`new-ride` event).\n\n**Auth:** User Bearer token required.\n\n**vehicleType** must be one of: `auto`, `car`, `moto`',
    security: [{ BearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['pickup', 'destination', 'vehicleType'],
            properties: {
              pickup:      { type: 'string', minLength: 3, example: 'Connaught Place, New Delhi' },
              destination: { type: 'string', minLength: 3, example: 'India Gate, New Delhi' },
              vehicleType: { type: 'string', enum: ['auto', 'car', 'moto'], example: 'car' },
            },
          },
        },
      },
    },
    responses: {
      201: { description: 'Ride created successfully', content: { 'application/json': { schema: { $ref: '#/components/schemas/Ride' } } } },
      400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
      500: { description: 'Ride creation failed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
    },
  },
};

definition.paths['/rides/confirm'] = {
  post: {
    tags: ['Rides'],
    summary: 'Captain accepts a ride',
    description: 'Updates ride status to `accepted` and assigns the captain. Sends a `ride-confirmed` Socket.IO event to the user.\n\n**Auth:** Captain Bearer token required.',
    security: [{ BearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['rideId'],
            properties: {
              rideId: { type: 'string', example: '64f9a1b2c3d4e5f6a7b8c9d0', description: 'Valid MongoDB ObjectId of the ride to confirm' },
            },
          },
          example: { rideId: '64f9a1b2c3d4e5f6a7b8c9d0' },
        },
      },
    },
    responses: {
      200: { description: 'Ride confirmed — user and captain populated, OTP included', content: { 'application/json': { schema: { $ref: '#/components/schemas/Ride' } } } },
      400: { description: 'Invalid rideId format', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
      401: { description: 'Unauthorized (Captain token required)', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
      500: { description: 'Ride not found or server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
    },
  },
};

definition.paths['/rides/start-ride'] = {
  get: {
    tags: ['Rides'],
    summary: 'Start a ride (OTP verification)',
    description: 'Verifies the 6-digit OTP provided by the user, updates status to `ongoing`, stores the current ride user on the captain record for live location broadcasting, and fires a `ride-started` Socket.IO event.\n\n**Auth:** Captain Bearer token required.',
    security: [{ BearerAuth: [] }],
    parameters: [
      { name: 'rideId', in: 'query', required: true, description: 'Valid MongoDB ObjectId of the ride', schema: { type: 'string' }, example: '64f9a1b2c3d4e5f6a7b8c9d0' },
      { name: 'otp',    in: 'query', required: true, description: '6-digit OTP shown to the user',     schema: { type: 'string', minLength: 6, maxLength: 6 }, example: '482915' },
    ],
    responses: {
      200: { description: 'Ride started successfully', content: { 'application/json': { schema: { $ref: '#/components/schemas/Ride' } } } },
      400: { description: 'Invalid rideId or OTP format', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
      500: { description: 'Wrong OTP, ride not accepted, or not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
    },
  },
};

definition.paths['/rides/end-ride'] = {
  post: {
    tags: ['Rides'],
    summary: 'End an ongoing ride',
    description: 'Updates ride status to `completed`, clears the captain\'s `currentRideUserId`, and fires a `ride-ended` Socket.IO event to the user.\n\n**Auth:** Captain Bearer token required.',
    security: [{ BearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['rideId'],
            properties: {
              rideId: { type: 'string', example: '64f9a1b2c3d4e5f6a7b8c9d0', description: 'Valid MongoDB ObjectId of the ongoing ride' },
            },
          },
          example: { rideId: '64f9a1b2c3d4e5f6a7b8c9d0' },
        },
      },
    },
    responses: {
      200: { description: 'Ride ended — status set to completed', content: { 'application/json': { schema: { $ref: '#/components/schemas/Ride' } } } },
      400: { description: 'Invalid rideId format', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
      500: { description: 'Ride not ongoing or not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
    },
  },
};

// ─────────────────────────────────────────────────────────────
// SWAGGER SPEC + EXPRESS ROUTER
// Serves /api-docs (HTML via CDN) and /api-docs.json (raw spec).
// Using CDN instead of swagger-ui-express because Vercel serverless
// cannot reliably serve the swagger-ui-dist static files, which
// causes "SwaggerUIBundle is not defined" in the browser.
// ─────────────────────────────────────────────────────────────
const { Router } = require('express');

const swaggerSpec = swaggerJsdoc({ definition, apis: [] });

const swaggerRouter = Router();

// Raw OpenAPI JSON — used by the UI and tools like Postman / Insomnia
swaggerRouter.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(swaggerSpec);
});

// Interactive Swagger UI loaded from CDN (works on Vercel + everywhere else)
swaggerRouter.get('/api-docs', (req, res) => {
    const specUrl = '/api-docs.json';
    res.setHeader('Content-Type', 'text/html');
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ubar Ride Share API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css" />
  <style>
    body { margin: 0; background: #fafafa; }
    .topbar { background-color: #1a1a2e !important; }
    .topbar .download-url-wrapper { display: none !important; }
    .swagger-ui .info h2.title { color: #e94560 !important; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function () {
      SwaggerUIBundle({
        url: "${specUrl}",
        dom_id: '#swagger-ui',
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        layout: 'StandaloneLayout',
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true,
      });
    };
  </script>
</body>
</html>`);
});

module.exports = { swaggerSpec, swaggerRouter };
