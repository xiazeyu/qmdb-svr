module.exports = process.env.env === 'development'
  ? {
    client: 'mysql2',
    connection: {
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: 'Cab230!',
      database: 'movies',
    },
  }
  : {
    client: 'mysql2',
    connection: {
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: 'passw0rd',
      database: 'movies',
    },
  };
