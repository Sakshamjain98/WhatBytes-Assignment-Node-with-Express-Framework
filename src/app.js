const express = require('express');
const swaggerUi = require('swagger-ui-express');
const auth = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const openapi = require('./openapi');

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/api/docs.json', (req, res) => res.json(openapi));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapi));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/patients', auth, require('./routes/patients'));
app.use('/api/doctors', auth, require('./routes/doctors'));
app.use('/api/mappings', auth, require('./routes/mappings'));

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use(errorHandler);

module.exports = app;
