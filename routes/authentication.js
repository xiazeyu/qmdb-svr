const bcrypt = require('bcrypt');
const express = require('express');
const jwt = require('jsonwebtoken');
const authorization = require('../middleware/authorization');

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

  const { email } = req.body;
  const { password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      error: true,
      message: 'Request body incomplete - email and password needed',
    });
    return;
  }

  const queryUsers = req.db
    .from('users')
    .select('*')
    .where('email', '=', email);

  queryUsers
    .then((users) => {
      if (users.length > 0) {
        throw new Error('User already exists');
      }

      // Not matching users
      return bcrypt.hash(password, saltRounds);
    })
    .then((passwordHash) => req.db.from('users').insert({
      email,
      password: passwordHash,
    }))
    .then(() => {
      res.status(201).json({
        success: true,
        message: 'User created',
      });
    }).catch((e) => {
      res.status(500).json({
        success: false,
        message: e.message,
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

  const { email } = req.body;
  const { password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      error: true,
      message: 'Request body incomplete - email and password needed',
    });
    return;
  }

  const queryUsers = req.db
    .from('users')
    .select('*')
    .where('email', '=', email);

  queryUsers
    .then((users) => {
      if (users.length === 0) {
        throw new Error('User does not exist');
      }

      const user = users[0];
      return bcrypt.compare(password, user.password);
    }).then((match) => {
      if (!match) {
        throw new Error('Password does not match');
      }

      // Create and return JWT token
      const expiresIn = 60 * 60 * 24;
      const exp = Math.floor(Date.now() / 1000) + expiresIn;
      const token = jwt.sign({ exp }, JWT_SECRET);
      res.status(200).json({
        token,
        token_type: 'Bearer',
        expiresIn,
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
 *         description:
 *           Unauthorized. Click on 'Schema' below to see the possible error
 *           responses.
 *         content:
 *           application/json:
 *             schema:
 *               "$ref": "#/components/schemas/TokenExpired"
 */
router.post('/refresh', authorization, (req, res, next) => {
  // uses users

  res.json({
    bearerToken: {
      token: 'ajsonwebtoken',
      token_type: 'Bearer',
      expires_in: 600,
    },
    refreshToken: {
      token: 'ajsonwebtoken',
      token_type: 'Refresh',
      expires_in: 86400,
    },
  });
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
 *         description:
 *           Unauthorized. Click on 'Schema' below to see the possible error
 *           responses.
 *         content:
 *           application/json:
 *             schema:
 *               "$ref": "#/components/schemas/TokenExpired"
 */
router.post('/logout', (req, res, next) => {
  res.json({
    error: false,
    message: 'Token successfully invalidated',
  });
});

/**
 * @openapi
 * "/user/{email}/profile":
 *   get:
 *     tags:
 *       - Authentication
 *     description: Get a user’s profile information as a JSON object. Click on 'Schema' below to see the possible error responses.
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
 *                 - "$ref": "#/components/schemas/MalformedJWT"
 *             examples:
 *               - "$ref": "#/components/examples/TokenExpired"
 *               - "$ref": "#/components/examples/InvalidJWT"
 *               - "$ref": "#/components/examples/MalformedJWT"
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
router.get('/:email/profile', (req, res, next) => {
  // uses users

  res.json({
    email: '',
  });
});

/**
 * @openapi
 * "/user/{email}/profile":
 *   put:
 *     tags:
 *       - Authentication
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
 *                 - "$ref": "#/components/schemas/MalformedJWT"
 *             examples:
 *               - "$ref": "#/components/examples/MissingAuthHeader"
 *               - "$ref": "#/components/examples/TokenExpired"
 *               - "$ref": "#/components/examples/InvalidJWT"
 *               - "$ref": "#/components/examples/MalformedJWT"
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
router.put('/:email/profile', (req, res, next) => {
  // uses users

  res.json({
    email: '',
    message: 'Profile updated',
  });
});

module.exports = router;
