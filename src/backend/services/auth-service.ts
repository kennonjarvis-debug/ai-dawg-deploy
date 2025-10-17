/**
 * Authentication Service
 * Handles user registration, login, and OAuth
 */

import { prisma } from '../config/database';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface CreateUserInput {
  email: string;
  password?: string;
  name?: string;
  googleId?: string;
  googleEmail?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export class AuthService {
  /**
   * Register a new user with email/password
   */
  async registerUser(input: CreateUserInput) {
    const { email, password, name } = input;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password if provided
    let hashedPassword: string | undefined;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 12);
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        emailVerified: false,
        isActive: true,
      },
    });

    // Create session
    const session = await this.createSession(user.id);

    return {
      user: this.sanitizeUser(user),
      session,
    };
  }

  /**
   * Login user with email/password
   */
  async loginUser(input: LoginInput) {
    const { email, password } = input;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    // Check if account is active
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Create session
    const session = await this.createSession(user.id);

    return {
      user: this.sanitizeUser(user),
      session,
    };
  }

  /**
   * Google OAuth login/register
   */
  async googleOAuthLogin(googleId: string, email: string, name?: string, profileImage?: string) {
    // Try to find existing user by Google ID
    let user = await prisma.user.findUnique({
      where: { googleId },
    });

    // If not found, try by email
    if (!user) {
      user = await prisma.user.findUnique({
        where: { email },
      });

      // If found by email, link Google account
      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId,
            googleEmail: email,
            emailVerified: true,
          },
        });
      }
    }

    // If still not found, create new user
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          googleId,
          googleEmail: email,
          name,
          profileImage,
          emailVerified: true,
          isActive: true,
        },
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Create session
    const session = await this.createSession(user.id);

    return {
      user: this.sanitizeUser(user),
      session,
    };
  }

  /**
   * Create a new session for user
   */
  async createSession(userId: string) {
    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY);

    const session = await prisma.session.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });

    return session;
  }

  /**
   * Verify session token and return user
   */
  async verifySession(token: string) {
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session) {
      throw new Error('Invalid session');
    }

    if (session.expiresAt < new Date()) {
      await prisma.session.delete({ where: { id: session.id } });
      throw new Error('Session expired');
    }

    return this.sanitizeUser(session.user);
  }

  /**
   * Logout user (delete session)
   */
  async logout(token: string) {
    await prisma.session.delete({
      where: { token },
    });
  }

  /**
   * Generate secure random token
   */
  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Remove sensitive data from user object
   */
  private sanitizeUser(user: any) {
    const { password, ...sanitized } = user;
    return sanitized;
  }

  /**
   * Generate JWT token (alternative to session tokens)
   */
  generateJWT(userId: string) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
  }

  /**
   * Verify JWT token
   */
  verifyJWT(token: string) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      return decoded.userId;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}

export const authService = new AuthService();
