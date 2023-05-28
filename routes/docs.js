const express = require('express');

const router = express.Router();

const swaggerUI = require('swagger-ui-express');
const swaggerDocument = require('../assignment_data/swagger.json');

router.use('/', swaggerUI.serve, swaggerUI.setup(swaggerDocument));

module.exports = router;
