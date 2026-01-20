import type { User, UserRole, UserWithPassword } from '@apostolic-path/shared';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { AuthRepository } from '../repositories/auth.repository.js';

const SALT_ROUNDS = 12;
const TOKEN_EXPIRY = '7d';

export interface TokenPayload {
  userId: string;
  churchId: string;
  email: string;
  role: UserRole;
}

export interface AuthResult {
  user: User;
  token: string;
  expiresIn: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  churchId: string;
  role?: UserRole;
  phone?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export class AuthService {
  private repository: AuthRepository;

  constructor() {
    this.repository = new AuthRepository();
  }

  /**
   * Register a new user
   */
  async register(input: RegisterInput): Promise<AuthResult> {
    // Check if email already exists
    const existing = await this.repository.findByEmail(input.email);
    if (existing) {
      throw new AuthError('EMAIL_EXISTS', 'An account with this email already exists');
    }

    // Verify church exists
    const church = await this.repository.findChurchById(input.churchId);
    if (!church) {
      throw new AuthError('CHURCH_NOT_FOUND', 'Church not found');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    const now = new Date().toISOString();
    const userWithPassword: Omit<UserWithPassword, 'id'> = {
      email: input.email.toLowerCase(),
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      churchId: input.churchId,
      role: input.role || 'member',
      phone: input.phone,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    const createdUser = await this.repository.createUser(userWithPassword);

    // Generate token
    const token = this.generateToken(createdUser);

    // Return user without password hash
    const { passwordHash: _, ...user } = createdUser;

    return {
      user,
      token,
      expiresIn: TOKEN_EXPIRY,
    };
  }

  /**
   * Login with email and password
   */
  async login(input: LoginInput): Promise<AuthResult> {
    const userWithPassword = await this.repository.findByEmail(input.email.toLowerCase());

    if (!userWithPassword) {
      throw new AuthError('INVALID_CREDENTIALS', 'Invalid email or password');
    }

    if (!userWithPassword.isActive) {
      throw new AuthError('ACCOUNT_DISABLED', 'This account has been disabled');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(input.password, userWithPassword.passwordHash);
    if (!isValidPassword) {
      throw new AuthError('INVALID_CREDENTIALS', 'Invalid email or password');
    }

    // Update last login
    await this.repository.updateLastLogin(userWithPassword.id, userWithPassword.churchId);

    // Generate token
    const token = this.generateToken(userWithPassword);

    // Return user without password hash
    const { passwordHash: _, ...user } = userWithPassword;

    return {
      user,
      token,
      expiresIn: TOKEN_EXPIRY,
    };
  }

  /**
   * Verify a JWT token and return payload
   */
  verifyToken(token: string): TokenPayload {
    try {
      const payload = jwt.verify(token, config.jwt.secret) as TokenPayload;
      return payload;
    } catch (error) {
      throw new AuthError('INVALID_TOKEN', 'Invalid or expired token');
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string, churchId: string): Promise<User | null> {
    const userWithPassword = await this.repository.findById(userId, churchId);
    if (!userWithPassword) return null;

    const { passwordHash: _, ...user } = userWithPassword;
    return user;
  }

  /**
   * Get user by email (useful for cross-church lookups)
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const userWithPassword = await this.repository.findByEmail(email.toLowerCase());
    if (!userWithPassword) return null;

    const { passwordHash: _, ...user } = userWithPassword;
    return user;
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    churchId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await this.repository.findById(userId, churchId);
    if (!user) {
      throw new AuthError('USER_NOT_FOUND', 'User not found');
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      throw new AuthError('INVALID_CREDENTIALS', 'Current password is incorrect');
    }

    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.repository.updatePassword(userId, churchId, newHash);
  }

  /**
   * Generate a JWT token for a user
   * Can be called with a user object or individual parameters
   */
  generateToken(user: UserWithPassword): string;
  generateToken(userId: string, churchId: string, role: UserRole, email: string): string;
  generateToken(
    userOrId: UserWithPassword | string,
    churchId?: string,
    role?: UserRole,
    email?: string
  ): string {
    if (typeof userOrId === 'string') {
      // Called with individual parameters
      const userId = userOrId;
      const payload: TokenPayload = {
        userId,
        churchId: churchId!,
        email: email!,
        role: role!,
      };
      return jwt.sign(payload, config.jwt.secret, {
        expiresIn: TOKEN_EXPIRY,
      });
    }

    // Called with user object
    const user = userOrId;
    const payload: TokenPayload = {
      userId: user.id,
      churchId: user.churchId,
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: TOKEN_EXPIRY,
    });
  }
}

/**
 * Custom error class for auth-related errors
 */
export class AuthError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'AuthError';
  }
}
