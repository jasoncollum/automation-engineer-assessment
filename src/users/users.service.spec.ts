import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UsersService', () => {
  let service: UsersService;

  // resusable test data
  const testUser: User = { id: 25, name: 'Test User', email: 'testuser@email.com' };
  const invalidEmail = { email: 'testuser' };
  const multipleUsers = [
    { id: 31, name: 'Test User 1', email: 'testuser1@email.com' },
    { id: 32, name: 'Test User 2', email: 'testuser2@email.com' },
    { id: 33, name: 'Test User 2', email: 'testuser2@email.com' },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });


  describe('create', () => {
    const createUserDto: CreateUserDto = {
      name: testUser.name,
      email: testUser.email,
    };

    it('should throw ConflictException if duplicate email', () => {
      service.users = [testUser];

      expect(() => {
        return service.create(createUserDto);
      }).toThrow(new ConflictException('User already exists'));
    });

    it('should create a new user', () => {
      const result = service.create(createUserDto);

      expect(result).toEqual({
        id: expect.any(Number),
        name: testUser.name,
        email: testUser.email,
      });
    });
  });


  describe('findAll', () => {
    it('should return an empty array if no users', () => {
      const result = service.findAll();

      expect(result).toEqual([]);
    });

    it('should return an array of users', () => {
      service.users = [testUser];

      const result = service.findAll();

      expect(result).toEqual([testUser]);
    });
  });


  describe('findOne', () => {
    it('should throw NotFoundException if user id not found', () => {
      expect(() => {
        return service.findOne(1);
      }).toThrow(new NotFoundException('User not found'));
    });

    it('should return user with given id', () => {
      service.users = [testUser];

      const result = service.findOne(25);

      expect(result).toEqual(testUser);
    });
  });


  describe('update', () => {
    let updateUserDto: UpdateUserDto = {
      name: 'Updated Name',
      email: 'updated@email.com',
    };

    it('should throw a NotFoundException if user id not found', () => {
      expect(() => {
        return service.update(1, updateUserDto);
      }).toThrow(new NotFoundException('User not found'));
    });

    it('should throw a ConflictException if duplicate email', () => {
      service.users = [testUser];
      let updateUserEmail: UpdateUserDto = { email: testUser.email };

      expect(() => {
        return service.update(25, updateUserEmail);
      }).toThrow(new ConflictException('Update failed'));
    });

    it('should update user with given id', () => {
      service.users = [testUser];

      service.update(testUser.id, updateUserDto);

      const updatedUser = service.findOne(testUser.id);

      expect(updatedUser).toEqual({ ...updateUserDto, id: testUser.id });
    });
  });


  describe('remove', () => {
    it('should throw a NotFoundException if user id not found', () => {
      expect(() => {
        return service.remove(1);
      }).toThrow(new NotFoundException('User not found'));
    });

    it('should delete user with given id', () => {
      service.users = [testUser];

      service.remove(25);

      const result = service.findAll();

      expect(result).toEqual([]);
    });
  });
});
