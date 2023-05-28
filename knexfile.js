module.exports = require('knex')({
  client: 'sqlite3', // or 'better-sqlite3'
  connection: {
    filename: './mydb.sqlite',
  },
});

// module.exports = knex = require('knex')({
// client: 'mysql',
// connection: {
//     host : '127.0.0.1',
//     port : 3306,
//     user : 'your_database_user',
//     password : 'your_database_password',
//     database : 'myapp_test'
// }
// });
