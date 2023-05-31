const bcrypt = require('bcrypt');
const express = require('express');
const jwt = require('jsonwebtoken');
const {
  authorization,
  deregisterRefreshToken,
  checkRefreshTokenIsInvalid,
} = require('../middleware/authorization');

const JWT_SECRET = process.env.SECRET_KEY;
const router = express.Router();

const saltRounds = 10;

/**
 * @openapi
 * "/user/register":
 *   post:
 *     tags:
 *       - Authentication
 *     description: Creates a new user account. A request body containing the user
 *       to be registered must be sent.
 *     requestBody:
 *       description: An object containing the email and password of the user to be
 *         registered.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: mike@gmail.com
 *               password:
 *                 type: string
 *                 example: password
 *     responses:
 *       "201":
 *         description: User successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User created
 *       "400":
 *         description: Bad request
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
 *                   example: Request body incomplete, both email and password are
 *                     required
 *       "409":
 *         description: User already exists
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
 *                   example: User already exists
 */
router.post('/register', (req, res, next) => {
  // uses users

  const { email, password } = req.body;

  if (!email || !password) {
    // Bad request
    return res.status(400).json({
      error: true,
      message: 'Request body incomplete, both email and password are required',
    });
  }

  return req.db
    .from('users')
    .select('*')
    .where('email', email)
    .then((users) => {
      if (users.length > 0) {
        // User already exists
        return res.status(409).json({
          error: true,
          message: 'User already exists',
        });
      }
      return bcrypt.hash(password, saltRounds)
        .then((passwordHash) => {
          req.db
            .from('users')
            .insert({
              email,
              password: passwordHash,
            })
            .then(() => {
              // User successfully created
              res.status(201).json({
                message: 'User created',
              });
            });
        });
    });
});

/**
 * @openapi
 * "/user/login":
 *   post:
 *     description:
 *       Log in to an existing user account. A request body containing the
 *       user credentials must be sent. The longExpiry bool is a setting for development
 *       use only that makes both tokens expire after a year.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       description: The credentials of the user to log in.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: mike@gmail.com
 *               password:
 *                 type: string
 *                 example: password
 *               longExpiry:
 *                 type: boolean
 *                 example: "false"
 *               bearerExpiresInSeconds:
 *                 type: number
 *                 example: 600
 *               refreshExpiresInSeconds:
 *                 type: boolean
 *                 example: 86400
 *     responses:
 *       "200":
 *         description: Log in successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bearerToken:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       example: ajsonwebtoken
 *                     token_type:
 *                       type: string
 *                       example: Bearer
 *                     expires_in:
 *                       type: number
 *                       example: 600
 *                 refreshToken:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       example: ajsonwebtoken
 *                     token_type:
 *                       type: string
 *                       example: Refresh
 *                     expires_in:
 *                       type: number
 *                       example: 86400
 *       "400":
 *         description: Invalid log in request
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
 *                   example: Request body incomplete, both email and password are
 *                     required
 *       "401":
 *         description: Log in failed
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
 *                   example: Incorrect email or password
 */
router.post('/login', (req, res, next) => {
  // uses users

  const { email, password } = req.body;
  let { longExpiry, bearerExpiresInSeconds, refreshExpiresInSeconds } = req.body;

  if (!email || !password) {
    // Invalid log in request
    return res.status(400).json({
      error: true,
      message: 'Request body incomplete, both email and password are required',
    });
  }

  longExpiry = longExpiry || false;
  bearerExpiresInSeconds = bearerExpiresInSeconds || 600;
  refreshExpiresInSeconds = refreshExpiresInSeconds || 86400;

  return req.db
    .from('users')
    .select('*')
    .where('email', email)
    .then((users) => {
      if (users.length === 0) {
        // User does not exist
        return res.status(401).json({
          error: true,
          message: 'Incorrect email or password',
        });
      }
      const user = users[0];
      return bcrypt.compare(password, user.password)
        .then((match) => {
          if (!match) {
            // Password does not match
            return res.status(401).json({
              error: true,
              message: 'Incorrect email or password',
            });
          }
          // Create and return JWT token
          const bearerExpiresIn = longExpiry ? 60 * 60 * 24 * 365 : bearerExpiresInSeconds;
          const refreshExpiresIn = longExpiry ? 60 * 60 * 24 * 365 : refreshExpiresInSeconds;
          const bearerExp = Math.floor(Date.now() / 1000) + bearerExpiresIn;
          const refreshExp = Math.floor(Date.now() / 1000) + refreshExpiresIn;
          const bearerToken = jwt.sign({
            email,
            exp: bearerExp,
          }, JWT_SECRET);
          const refreshToken = jwt.sign({
            email,
            exp: refreshExp,
          }, JWT_SECRET);
          // Log in successful
          return res.status(200).json({
            bearerToken: {
              token: bearerToken,
              token_type: 'Bearer',
              expires_in: bearerExpiresIn,
            },
            refreshToken: {
              token: refreshToken,
              token_type: 'Refresh',
              expires_in: refreshExpiresIn,
            },
          });
        });
    });
});

/**
 * @openapi
 * "/user/refresh":
 *   post:
 *     description: Obtain a new bearer token by using a refresh token
 *     tags:
 *       - Authentication
 *     requestBody:
 *       description: The refresh token
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: ajsonwebtoken
 *     responses:
 *       "200":
 *         description: Token successfully refreshed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bearerToken:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       example: ajsonwebtoken
 *                     token_type:
 *                       type: string
 *                       example: Bearer
 *                     expires_in:
 *                       type: number
 *                       example: 600
 *                 refreshToken:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       example: ajsonwebtoken
 *                     token_type:
 *                       type: string
 *                       example: Refresh
 *                     expires_in:
 *                       type: number
 *                       example: 86400
 *       "400":
 *         description: Invalid refresh request
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
 *                   example: Request body incomplete, refresh token required
 *       "401":
 *         description: Unauthorized. Click on 'Schema' below to see the possible error responses.
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - "$ref": "#/components/schemas/TokenExpired"
 *                 - "$ref": "#/components/schemas/InvalidJWT"
 *             examples:
 *               - "$ref": "#/components/examples/TokenExpired"
 *               - "$ref": "#/components/examples/InvalidJWT"
 */
router.post('/refresh', (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    // Invalid refresh request
    return res.status(400).json({
      error: true,
      message: 'Request body incomplete, refresh token required',
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    if (checkRefreshTokenIsInvalid(refreshToken)) {
      // JWT token has expired
      return res.status(401).json({
        error: true,
        message: 'JWT token has expired',
      });
    }

    deregisterRefreshToken(refreshToken, decoded.exp);
    // Create and return JWT token
    const bearerExpiresIn = 600;
    const refreshExpiresIn = 86400;
    const bearerExp = Math.floor(Date.now() / 1000) + bearerExpiresIn;
    const refreshExp = Math.floor(Date.now() / 1000) + refreshExpiresIn;
    const newBearerToken = jwt.sign({
      email: decoded.email,
      exp: bearerExp,
    }, JWT_SECRET);
    const newRefreshToken = jwt.sign({
      email: decoded.email,
      exp: refreshExp,
    }, JWT_SECRET);
    // Token successfully refreshed
    return res.status(200).json({
      bearerToken: {
        token: newBearerToken,
        token_type: 'Bearer',
        expires_in: bearerExpiresIn,
      },
      refreshToken: {
        token: newRefreshToken,
        token_type: 'Refresh',
        expires_in: refreshExpiresIn,
      },
    });
  } catch (e) {
    if (e.name === 'TokenExpiredError') {
      // JWT token has expired
      return res.status(401).json({
        error: true,
        message: 'JWT token has expired',
      });
    }
    // Invalid JWT token
    return res.status(401).json({
      error: true,
      message: 'Invalid JWT token',
    });
  }
});

/**
 * @openapi
 * "/user/logout":
 *   post:
 *     description: Log the user out, invalidating the refresh token
 *     tags:
 *       - Authentication
 *     requestBody:
 *       description: The refresh token
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: ajsonwebtoken
 *     responses:
 *       "200":
 *         description: Token successfully invalidated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Token successfully invalidated
 *       "400":
 *         description: Invalid refresh request
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
 *                   example: Request body incomplete, refresh token required
 *       "401":
 *         description: Unauthorized. Click on 'Schema' below to see the possible error responses.
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - "$ref": "#/components/schemas/TokenExpired"
 *                 - "$ref": "#/components/schemas/InvalidJWT"
 *             examples:
 *               - "$ref": "#/components/examples/TokenExpired"
 *               - "$ref": "#/components/examples/InvalidJWT"
 */
router.post('/logout', (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    // Invalid refresh request
    return res.status(400).json({
      error: true,
      message: 'Request body incomplete, refresh token required',
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    // JWT token has expired
    if (checkRefreshTokenIsInvalid(refreshToken)) {
      return res.status(401).json({
        error: true,
        message: 'JWT token has expired',
      });
    }

    deregisterRefreshToken(refreshToken, decoded.exp);
    // Token successfully invalidated
    return res.status(200).json({
      error: false,
      message: 'Token successfully invalidated',
    });
  } catch (e) {
    if (e.name === 'TokenExpiredError') {
      // JWT token has expired
      return res.status(401).json({
        error: true,
        message: 'JWT token has expired',
      });
    }
    // Invalid JWT token
    return res.status(401).json({
      error: true,
      message: 'Invalid JWT token',
    });
  }
});

/**
 * @openapi
 * "/user/{email}/profile":
 *   get:
 *     tags:
 *       - Authentication
 *     description: Get a user’s profile information as a JSON object.
 *     parameters:
 *       - name: email
 *         in: path
 *         description: The email address of the user whose profile is to be updated.
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       "200":
 *         description: Returns a user's profile information as a JSON object.
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: mike@gmail.com
 *                     firstName:
 *                       type: string
 *                       example: Michael
 *                     lastName:
 *                       type: string
 *                       example: Jordan
 *                 - type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: mike@gmail.com
 *                     firstName:
 *                       type: string
 *                       example: Michael
 *                     lastName:
 *                       type: string
 *                       example: Jordan
 *                     dob:
 *                       type: string
 *                       example: 1963-02-17
 *                     address:
 *                       type: string
 *                       example: 123 Fake Street, Springfield
 *             examples:
 *               - unauthorised:
 *                 summary: unauthorised or from a different user
 *                 description: An unauthorised request (without an ‘Authorized:’ header) or a request from a different user will receive an object like this
 *                 value:
 *                   email: mike@gmail.com
 *                   firstName: Michael
 *                   lastName: Jordan
 *               - authorised:
 *                 summary: valid token belonging owner
 *                 description: with a valid JWT bearer token belonging to the profile’s owner, will receive an object like this, with additional fields for date of birth and address
 *                 value:
 *                   email: mike@gmail.com
 *                   firstName: Michael
 *                   lastName: Jordan
 *                   dob: 1963-02-17
 *                   address: 123 Fake Street, Springfield
 *               - authorised_new:
 *                 summary: new user
 *                 description: Note that a newly created user will not have any of these fields filled in. The server will return null for any fields that have not been provided
 *                 value:
 *                   email: notmike@gmail.com
 *                   firstName: null
 *                   lastName: null
 *                   dob: null
 *                   address: null
 *       "401":
 *         description: Unauthorized. Click on 'Schema' below to see the possible error responses.
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - "$ref": "#/components/schemas/TokenExpired"
 *                 - "$ref": "#/components/schemas/InvalidJWT"
 *             examples:
 *               - "$ref": "#/components/examples/TokenExpired"
 *               - "$ref": "#/components/examples/InvalidJWT"
 *       "404":
 *         description: If {email} corresponds to a non-existent user, the following response will be returned with a status code of 404 Not Found.
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
 *                   example: User not found
 */
router.get('/:email/profile', authorization, (req, res, next) => {
  // uses users

  const { email } = req.params;

  return req.db
    .from('users')
    .select('*')
    .where('email', email)
    .then((users) => {
      if (users.length === 0) {
        // If {email} corresponds to a non-existent user, the following response will be returned with a status code of 404 Not Found.
        return res.status(404).json({
          error: true,
          message: 'User not found',
        });
      }

      const user = users[0];

      if (req.authorized && req.username === email) {
        // with a valid JWT bearer token belonging to the profile’s owner, will receive an object like this, with additional fields for date of birth and address
        return res.status(200).json({
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          dob: user.dob,
          address: user.address,
        });
      }
      // An unauthorised request (without an ‘Authorized:’ header) or a request from a different user will receive an object like this
      return res.status(200).json({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      });
    });
});

function isDateStringValid(dateString) {
  if (!(/^[0-9]{4}-[0-1][0-9]-[0-3][0-9]$/).test(dateString)) {
    return false;
  }

  const [year, month, day] = dateString.split('-');

  if (!year || !month || !day) {
    return false;
  }

  const date = new Date(dateString);
  if (date instanceof Date && !Number.isNaN(Number(date))) {
    return date.getFullYear() === Number(year)
      && date.getMonth() === Number(month) - 1 // Months are 0-indexed in JavaScript
      && date.getDate() === Number(day);
  }
  return false;
}

/**
 * @openapi
 * "/user/{email}/profile":
 *   put:
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     description: To provide profile information. Users can only change their own profile information.
 *     parameters:
 *       - name: email
 *         in: path
 *         description: The email address of the user whose profile is to be updated.
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       description: An object containing the user’s profile information.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: Michael
 *               lastName:
 *                 type: string
 *                 example: Jordan
 *               dob:
 *                 type: string
 *                 example: 1963-02-17
 *               address:
 *                 type: string
 *                 example: 123 Fake Street, Springfield
 *     responses:
 *       "200":
 *         description: If you successfully update a profile, the response will be an object containing the updated profile.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 email:
 *                   type: string
 *                   example: mike@gmail.com
 *                 firstName:
 *                   type: string
 *                   example: Michael
 *                 lastName:
 *                   type: string
 *                   example: Jordan
 *                 dob:
 *                   type: string
 *                   example: 1963-02-17
 *                 address:
 *                   type: string
 *                   example: 123 Fake Street, Springfield
 *       "403":
 *         description: If the user is logged in with the wrong email (that is, the JWT is provided and is valid, but the credentials do not belong to the user whose profile the user is attempting to modify).
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
 *                   example: Forbidden
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
 *         description: If {email} corresponds to a non-existent user, the following response will be returned with a status code of 404 Not Found
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
 *                   example: User not found
 *       "400":
 *         description: Bad Request. Click on 'Schema' below to see the possible error responses.
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   description: If the submitted object does not contain all of the fields.
 *                   properties:
 *                     error:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: "Request body incomplete: firstName, lastName, dob and address are required"
 *                 - type: object
 *                   description: If any of the fields are not strings.
 *                   properties:
 *                     error:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: "Request body invalid: firstName, lastName, dob and address must be strings only"
 *                 - type: object
 *                   description: If the date of birth is not a valid YYYY-MM-DD date (e.g. no April 31 or February 30, or February 29 on a non-leap year).
 *                   properties:
 *                     error:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: "Invalid input: dob must be a real date in format YYYY-MM-DD"
 *             examples:
 *               - incomplete:
 *                 summary: Request body incomplete
 *                 description: If the submitted object does not contain all of the fields.
 *                 value:
 *                   error: true
 *                   message: "Request body incomplete: firstName, lastName, dob and address are required"
 *               - bodyInvalid:
 *                 summary: Request body invalid
 *                 description: If any of the fields are not strings.
 *                 value:
 *                   error: true
 *                   message: "Request body invalid: firstName, lastName, dob and address must be strings only"
 *               - inputInvalid:
 *                 summary: Invalid input
 *                 description: If the date of birth is not a valid YYYY-MM-DD date (e.g. no April 31 or February 30, or February 29 on a non-leap year).
 *                 value:
 *                   error: true
 *                   message: "Invalid input: dob must be a real date in format YYYY-MM-DD"
 */
router.put('/:email/profile', authorization, (req, res, next) => {
  // uses users

  const { email } = req.params;
  const {
    firstName, lastName, dob, address,
  } = req.body;

  if (!firstName || !lastName || !dob || !address) {
    // If the submitted object does not contain all of the fields.
    return res.status(400).json({
      error: true,
      message: 'Request body incomplete: firstName, lastName, dob and address are required',
    });
  }

  if (typeof firstName !== 'string'
    || typeof lastName !== 'string'
    || typeof dob !== 'string'
    || typeof address !== 'string') {
    // If any of the fields are not strings.
    return res.status(400).json({
      error: true,
      message: 'Request body invalid: firstName, lastName, dob and address must be strings only',
    });
  }

  if (!isDateStringValid(dob)) {
    return res.status(400).json({
      error: true,
      message: 'Invalid input: dob must be a real date in format YYYY-MM-DD',
    });
  }

  if (!req.authorized) {
    return res.status(401).json({
      error: true,
      message: "Authorization header ('Bearer token') not found",
    });
  }

  if (req.username !== email) {
    // If the user is logged in with the wrong email (that is, the JWT is provided and is valid, but the credentials do not belong to the user whose profile the user is attempting to modify).
    return req.status(403).json({
      error: true,
      message: 'Forbidden',
    });
  }

  return req.db
    .from('users')
    .select('*')
    .where('email', email)
    .then((users) => {
      if (users.length === 0) {
        // If {email} corresponds to a non-existent user, the following response will be returned with a status code of 404 Not Found
        return res.status(404).json({
          error: true,
          message: 'User not found',
        });
      }
      return req.db
        .from('users')
        .where('email', email)
        .update({
          firstName,
          lastName,
          dob,
          address,
        })
        .then(() => req.db
          .from('users')
          .select('*')
          .where('email', email)
          .then((newUsers) => {
            const user = newUsers[0];
            // If you successfully update a profile, the response will be an object containing the updated profile.
            return res.status(200).json({
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              dob: user.dob,
              address: user.address,
            });
          }));
    });
});

module.exports = router;
