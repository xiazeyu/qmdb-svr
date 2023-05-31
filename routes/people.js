const express = require('express');

const router = express.Router();

/**
 * @openapi
 * "/people/{id}":
 *   get:
 *     tags:
 *       - People
 *     description:
 *       Get information about a person (actor, writer, director etc.) from
 *       their IMDB ID.
 *     parameters:
 *       - name: id
 *         in: path
 *         description: The person's IMDB ID
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: An object containing data about that person
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                   example: Patrick Stewart
 *                 birthYear:
 *                   type: integer
 *                   example: 1940
 *                 deathYear:
 *                   type: integer
 *                   example:
 *                 roles:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       movieName:
 *                         type: string
 *                         example: "Star Trek: First Contact"
 *                       movieId:
 *                         type: string
 *                         example: tt0117731
 *                       category:
 *                         type: string
 *                         example: actor
 *                       characters:
 *                         type: array
 *                         items:
 *                           type: string
 *                           example: Picard
 *                       imdbRating:
 *                         type: number
 *                         example: 7.6
 *       "400":
 *         description: Invalid query parameters. Click on 'Schema' to see possible
 *           error responses.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: "true"
 *                 message:
 *                   type: string
 *                   example: "Invalid query parameters: year. Query parameters are not permitted."
 *       "401":
 *         description: Unauthorized. Click on 'Schema' below to see the possible error responses.
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - "$ref": "#/components/schemas/MissingAuthHeader"
 *                 - "$ref": "#/components/schemas/TokenExpired"
 *                 - "$ref": "#/components/schemas/InvalidJWT"
 *             examples:
 *               - "$ref": "#/components/examples/MissingAuthHeader"
 *               - "$ref": "#/components/examples/TokenExpired"
 *               - "$ref": "#/components/examples/InvalidJWT"
 *       "404":
 *         description: The requested person could not be found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: "true"
 *                 message:
 *                   type: string
 *                   example: No record exists of a person with this ID
 */
router.get('/:id', (req, res, next) => {
  // uses basics, names

  const { id } = req.params;

  const queryKeys = Object.keys(req.query);

  if (queryKeys.length > 0) {
    // Invalid query parameters
    res
      .status(400)
      .json({
        error: true,
        message: `Invalid query parameters: ${queryKeys.join(', ')}. Query parameters are not permitted.`,
      });
    return;
  }
  // 3 x 401

  req.db
    .from('names')
    .select('*')
    .where('nconst', '=', id)
    .then((people) => {
      if (people.length) {
        const person = people[0];
        req.db
          .from('principals')
          .where('nconst', id)
          .join('basics', 'principals.tconst', 'basics.tconst')
          .select('*')
          .then((roles) => {
            res.status(200).json({
              name: person.primaryName,
              birthYear: person.birthYear,
              deathYear: person.deathYear,
              roles: roles.map((role) => ({
                movieName: role.primaryTitle,
                movieId: role.tconst,
                category: role.category,
                characters: JSON.parse(role.characters || '[]'),
                imdbRating: role.imdbRating,
              })),
            });
          });
      } else {
        // The requested person could not be found
        res.status(404).json({
          error: true,
          message: 'No record exists of a person with this ID',
        });
      }
    });
});

module.exports = router;
