const knex = require('knex')(require('../configs/knexfile'));

module.exports = (req, res, next) => {
  req.db = knex;
  next();
};
