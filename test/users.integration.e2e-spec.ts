import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { UsersService } from '../src/users/users.service';
import { UsersModule } from '../src/users/users.module';

describe('Users Integration', () => {
  let app: INestApplication;
  let usersService: UsersService;

  // resusable test data
  const testUser = { id: 25, name: 'Test User', email: 'testuser@email.com' };
  const invalidEmail = { email: 'testuser' };
  const multipleUsers = [
    { id: 31, name: 'Test User 1', email: 'testuser1@email.com' },
    { id: 32, name: 'Test User 2', email: 'testuser2@email.com' },
    { id: 33, name: 'Test User 2', email: 'testuser2@email.com' },
  ];

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [UsersModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // enable validation during testing
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    usersService = moduleFixture.get<UsersService>(UsersService);
  });

  afterEach(async () => {
    // close app after each test in order to avoid conflicts
    await app.close();
  });

  // CREATE NEW USER
  describe('POST /users - Create a new user', () => {

    it('should create a new user - return the user and a 201 status code', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({
          name: testUser.name,
          email: testUser.email,
        })
        .expect(201)
        .expect(({ body }) => {
          expect(body).toEqual({
            id: expect.any(Number),
            name: testUser.name,
            email: testUser.email,
          })
        });
    });

    it('should return a 400 status code if invalid email', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({
          name: testUser.name,
          email: 'testuser',
        })
        .expect(400);
    });

    it('should return a 400 status code if invalid name (name must be a string)', () => {
      // NOTE:  name can be an empty string (of any length) as CreateUserDto only requires that name be a string
      return request(app.getHttpServer())
        .post('/users')
        .send({
          name: 123,
          email: testUser.email,
        })
        .expect(400);
    });

    it('should return error if duplicate email', () => {
      // populate users array with a user
      usersService.users.push(testUser);

      return request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'userName',
          email: testUser.email,
        })
        .expect(({ body }) => {
          expect(body.message).toEqual('User already exists');
        });
    });
  })

  // GET ALL USERS
  describe('GET /users', () => {

    it('should return an array of all users', () => {
      // populate users array with multiple users
      usersService.users.push(...multipleUsers);

      return request(app.getHttpServer())
        .get('/users')
        .expect(200)
        .expect(({ body }) => {
          expect(body).toEqual(expect.arrayContaining([...multipleUsers]));
          expect(body).toHaveLength(multipleUsers.length);
        });
    });

    it('should return an empty array and a 200 status code if no users found', () => {
      return request(app.getHttpServer())
        .get('/users')
        .expect(200)
        .expect(({ body }) => {
          expect(body).toEqual([]);
        });
    });
  });

  // GET USER BY ID
  describe('GET /users{id} - Retrieve a user by ID', () => {

    it('should return correct user details and 200 status code', () => {
      // populate users array with a user
      usersService.users.push(testUser);

      return request(app.getHttpServer())
        .get(`/users/${testUser.id}`)
        .expect(200)
        .expect(({ body }) => {
          expect(body).toEqual(testUser);
        });
    });

    it('should return a 404 status code if user id not found', () => {
      return request(app.getHttpServer())
        .get('/users/1')
        .expect(404)
        .expect(({ body }) => {
          expect(body.message).toEqual('User not found');
        });
    });
  });

  // UPDATE USER
  describe('PATCH /users{id} - Update a user', () => {
    // NOTE:  async/await in order to make GET request after PATCH (as UsersService does not return updated user)
    it('should update a user and return a 204 status code and confirm updated details', async () => {
      // populate users array with a user to update
      usersService.users.push(testUser);

      const updatedUserData = { name: 'Updated Name', email: 'updated@email.com' };

      await request(app.getHttpServer())
        .patch(`/users/${testUser.id}`)
        .send(updatedUserData)
        .expect(204);

      return request(app.getHttpServer())
        .get(`/users/${testUser.id}`)
        .expect(({ body }) => {
          expect(body).toEqual({ ...updatedUserData, id: testUser.id });
        });
    });

    it('should return a 404 status code and error message if user id not found', () => {
      const updatedUserData = { name: 'Updated Name', email: 'updated@email.com' };

      return request(app.getHttpServer())
        .patch(`/users/${testUser.id}`)
        .send(updatedUserData)
        .expect(404)
        .expect(({ body }) => {
          expect(body.message).toEqual('User not found');
        });
    });

    it('should return a 400 status code if invalid email', () => {
      // populate users array with a user to update
      usersService.users.push(testUser);

      return request(app.getHttpServer())
        .patch(`/users/${testUser.id}`)
        .send(invalidEmail)
        .expect(400);
    });

    it('should return a 400 status code if invalid name (name must be a string)', () => {
      // NOTE:  name can be an empty string (of any length) as CreateUserDto only requires that name be a string
      // populate users array with a user to update
      usersService.users.push(testUser);

      return request(app.getHttpServer())
        .patch(`/users/${testUser.id}`)
        .send({ name: 123 })
        .expect(400);
    });

    it('should return error message if duplicate email', () => {
      // populate users array with a user to update
      usersService.users.push(testUser);

      const existingEmail = { email: testUser.email };

      return request(app.getHttpServer())
        .patch(`/users/${testUser.id}`)
        .send(existingEmail)
        .expect(({ body }) => {
          expect(body.message).toEqual('Update failed');
        });
    });
  });

  // DELETE USER
  describe('DELETE /users{id} - Delete a user', () => {

    it('should delete user, return a 204 status code and confirm user deleted', async () => {
      // populate users array with multiple users
      usersService.users.push(...multipleUsers, testUser);

      await request(app.getHttpServer())
        .delete(`/users/${testUser.id}`)
        .expect(204);

      // confirm deletion
      return request(app.getHttpServer())
        .get(`/users/${testUser.id}`)
        .expect(404);
    });

    it('should return a 404 status code and error message if user id not found', () => {
      return request(app.getHttpServer())
        .delete('/users/1')
        .expect(404)
        .expect(({ body }) => {
          expect(body.message).toEqual('User not found');
        });
    });
  });
});