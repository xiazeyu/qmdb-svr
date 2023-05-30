const express = require('express');

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');
const swaggerDefinition = require('../configs/swaggerDefinition.json');

const router = express.Router();

const openapiSpecification = swaggerJsdoc({
  failOnErrors: process.env.env === 'development',
  definition: swaggerDefinition,
  apis: ['./routes/*.js'],
});
const swaggerDocument = openapiSpecification;

// const SwaggerDocument = require('../assignment_data/swagger.json');

// middleware that is specific to this router
router.use('/', swaggerUI.serve);

/**
 * @openapi
 * "/":
 *   get:
 *     tags:
 *       - Documents
 *     description: Returns the Swagger UI with API generated from the source code.
 *     responses:
 *       200:
 *         description: Swagger UI.
 *         content:
 *           text/html:
 *             schema: ~
 */
router.get('/', swaggerUI.setup(swaggerDocument));

module.exports = router;
