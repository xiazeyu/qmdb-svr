const express = require('express');

const router = express.Router();

/**
 * @openapi
 * "/movies/search":
 *   get:
 *     tags:
 *       - Movies
 *     description:
 *       Returns a list of movie data. The list is arranged by imdbId, in
 *       ascending order.
 *     parameters:
 *       - name: title
 *         in: query
 *         description: Text to search for in the primary title of the movie.
 *         required: false
 *         schema:
 *           type: string
 *       - name: year
 *         in: query
 *         description: The year of initial release of the movie
 *         required: false
 *         schema:
 *           type: string
 *       - name: page
 *         in: query
 *         description: Page number
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       "200":
 *         description:
 *           An array of objects containing title, year, imdbID, imdbRating,
 *           rottenTomatoesRating, metacriticRating and classification properties.
 *           The results are limited to 100 per page. An example of one object in the
 *           array is shown below.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                         example: "Star Trek: First Contact"
 *                       year:
 *                         type: integer
 *                         example: 1996
 *                       imdbID:
 *                         type: string
 *                         example: tt0117731
 *                       imdbRating:
 *                         type: number
 *                         example: 7.6
 *                       rottenTomatoesRating:
 *                         type: number
 *                         example: 92
 *                       metacriticRating:
 *                         type: number
 *                         example: 71
 *                       classification:
 *                         type: string
 *                         example: PG-13
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                       example: 6
 *                     lastPage:
 *                       type: number
 *                       example: 1
 *                     perPage:
 *                       type: number
 *                       example: 100
 *                     currentPage:
 *                       type: number
 *                       example: 1
 *                     from:
 *                       type: number
 *                       example: 0
 *                     to:
 *                       type: number
 *                       example: 6
 *       "400":
 *         description:
 *           Invalid year query parameter. Click on 'Schema' below to see
 *           the possible error responses.
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - "$ref": "#/components/schemas/InvalidYearFormat"
 *                 - "$ref": "#/components/schemas/InvalidPageFormat"
 *             examples:
 *               - "$ref": "#/components/examples/InvalidYearFormat"
 *               - "$ref": "#/components/examples/InvalidPageFormat"
 */
router.get('/search', (req, res, next) => {
  // uses basics
  req.db
    .from('basics')
    .select('originalTitle', 'year', 'runtimeMinutes')
    .then((rows) => {
      res.json({ data: rows });
    })
    .catch((err) => {
      console.log(err);
      res.json({ Error: true, Message: 'Error in MySQL query' });
    });
});

/**
 * @openapi
 * "/movies/data/{imdbID}":
 *   get:
 *     tags:
 *       - Movies
 *     description: Get data for a movie by imdbID
 *     operationId: getMovieData
 *     parameters:
 *       - name: imdbID
 *         in: path
 *         description: The imdbID of the movie
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       "200":
 *         description: An object containing the data for the movie.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 title:
 *                   type: string
 *                   example: "Star Trek: First Contact"
 *                 year:
 *                   type: integer
 *                   example: 1996
 *                 runtime:
 *                   type: integer
 *                   example: 111
 *                 genres:
 *                   type: array
 *                   items:
 *                     type: string
 *                     example: Action
 *                   example:
 *                     - Action
 *                     - Adventure
 *                     - Drama
 *                 country:
 *                   type: string
 *                   example: United States
 *                 principals:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: nm0001772
 *                       name:
 *                         type: string
 *                         example: Patrick Stewart
 *                       category:
 *                         type: string
 *                         example: actor
 *                       characters:
 *                         type: array
 *                         items:
 *                           type: string
 *                           example: Picard
 *                     required:
 *                       - id
 *                       - name
 *                       - category
 *                       - characters
 *                   example:
 *                     - id: nm0005772
 *                       category: cinematographer
 *                       name: Matthew F. Leonetti
 *                       characters: []
 *                     - id: nm0001772
 *                       category: actor
 *                       name: Patrick Stewart
 *                       characters:
 *                         - Picard
 *                     - id: nm0000408
 *                       category: actor
 *                       name: Jonathan Frakes
 *                       characters:
 *                         - Riker
 *                     - id: nm0000653
 *                       category: actor
 *                       name: Brent Spiner
 *                       characters:
 *                         - Data
 *                     - id: nm0000996
 *                       category: actor
 *                       name: LeVar Burton
 *                       characters:
 *                         - Geordi
 *                     - id: nm0734472
 *                       category: writer
 *                       name: Gene Roddenberry
 *                       characters: []
 *                     - id: nm0075834
 *                       category: writer
 *                       name: Rick Berman
 *                       characters: []
 *                     - id: nm0103804
 *                       category: writer
 *                       name: Brannon Braga
 *                       characters: []
 *                     - id: nm0601822
 *                       category: writer
 *                       name: Ronald D. Moore
 *                       characters: []
 *                     - id: nm0000025
 *                       category: composer
 *                       name: Jerry Goldsmith
 *                       characters: []
 *                 ratings:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       source:
 *                         type: string
 *                         example: Internet Movie Database
 *                       value:
 *                         type: number
 *                         example: 7.6
 *                 boxoffice:
 *                   type: integer
 *                   example: 92027888
 *                 poster:
 *                   type: string
 *                   example: https://m.media-amazon.com/images/M/MV5BYzMzZmE3MTItODYzYy00YWI5LWFkNWMtZTY5NmU2MDkxYWI1XkEyXkFqcGdeQXVyMjUzOTY1NTc@._V1_SX300.jpg
 *                 plot:
 *                   type: string
 *                   example:
 *                     The Borg travel back in time intent on preventing Earth's
 *                     first contact with an alien species. Captain Picard and his
 *                     crew pursue them to ensure that Zefram Cochrane makes his maiden
 *                     flight reaching warp speed.
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
 *                   example: "Invalid query parameters: year. Query parameters are
 *                     not permitted."
 *       "404":
 *         description: The requested movie could not be found
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
 *                   example: No record exists of a movie with this ID
 */
router.get('/data/:imdbID', (req, res, next) => {
  // uses basics, principals, ratings

  // const { imdbID } = req.params;

  req.db
    .from('basics')
    .select('*')
    .where('tconst', '=', req.params.imdbID)
    .then((rows) => {
      res.json(rows);
    })
    .catch((err) => {
      console.log(err);
      res.json({ Error: true, Message: 'Error in MySQL query' });
    });
});
module.exports = router;
