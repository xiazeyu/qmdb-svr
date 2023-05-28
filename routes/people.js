const express = require('express');

const router = express.Router();

/* GET users listing. */
router.get('/:id', (req, res, next) => {
  const { id } = req.params;

  res.json({
    name: 'Patrick Stewart',
    birthYear: 1940,
    deathYear: null,
    roles: [
      {
        movieName: 'Star Trek: First Contact',
        movieId: 'tt0117731',
        category: 'actor',
        characters: [
          'Picard',
        ],
        imdbRating: 7.6,
      },
    ],
  });
});

module.exports = router;
