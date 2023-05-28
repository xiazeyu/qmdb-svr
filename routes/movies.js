const express = require('express');

const router = express.Router();

router.get('/search', (req, res, next) => {
  res.json({
    data: [
      {
        title: 'Star Trek: First Contact',
        year: 1996,
        imdbID: 'tt0117731',
        imdbRating: 7.6,
        rottenTomatoesRating: 92,
        metacriticRating: 71,
        classification: 'PG-13',
      },
    ],
    pagination: {
      total: 6,
      lastPage: 1,
      perPage: 100,
      currentPage: 1,
      from: 0,
      to: 6,
    },
  });
});

router.get('/data/:imdbID', (req, res, next) => {
  const { imdbID } = req.params;

  res.json({
    title: 'Star Trek: First Contact',
    year: 1996,
    runtime: 111,
    genres: [
      'Action',
      'Adventure',
      'Drama',
    ],
    country: 'United States',
    principals: [
      {
        id: 'nm0005772',
        category: 'cinematographer',
        name: 'Matthew F. Leonetti',
        characters: [],
      },
      {
        id: 'nm0001772',
        category: 'actor',
        name: 'Patrick Stewart',
        characters: [
          'Picard',
        ],
      },
      {
        id: 'nm0000408',
        category: 'actor',
        name: 'Jonathan Frakes',
        characters: [
          'Riker',
        ],
      },
      {
        id: 'nm0000653',
        category: 'actor',
        name: 'Brent Spiner',
        characters: [
          'Data',
        ],
      },
      {
        id: 'nm0000996',
        category: 'actor',
        name: 'LeVar Burton',
        characters: [
          'Geordi',
        ],
      },
      {
        id: 'nm0734472',
        category: 'writer',
        name: 'Gene Roddenberry',
        characters: [],
      },
      {
        id: 'nm0075834',
        category: 'writer',
        name: 'Rick Berman',
        characters: [],
      },
      {
        id: 'nm0103804',
        category: 'writer',
        name: 'Brannon Braga',
        characters: [],
      },
      {
        id: 'nm0601822',
        category: 'writer',
        name: 'Ronald D. Moore',
        characters: [],
      },
      {
        id: 'nm0000025',
        category: 'composer',
        name: 'Jerry Goldsmith',
        characters: [],
      },
    ],
    ratings: [
      {
        source: 'Internet Movie Database',
        value: 7.6,
      },
    ],
    boxoffice: 92027888,
    poster: 'https://m.media-amazon.com/images/M/MV5BYzMzZmE3MTItODYzYy00YWI5LWFkNWMtZTY5NmU2MDkxYWI1XkEyXkFqcGdeQXVyMjUzOTY1NTc@._V1_SX300.jpg',
    plot: "The Borg travel back in time intent on preventing Earth's first contact with an alien species. Captain Picard and his crew pursue them to ensure that Zefram Cochrane makes his maiden flight reaching warp speed.",
  });
});
module.exports = router;
