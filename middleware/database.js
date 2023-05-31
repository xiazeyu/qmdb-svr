const knex = require('knex')(require('../configs/knexfile'));
const { attachPaginate } = require('knex-paginate');

attachPaginate();

module.exports = (req, res, next) => {
  req.db = knex;
  next();
};
