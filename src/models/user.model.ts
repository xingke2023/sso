import { pool } from '../config/database';
import { User, CreateUserInput } from '../types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export const userModel = {
  async findById(id: number): Promise<User | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    return (rows[0] as User) ?? null;
  },

  async findByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return (rows[0] as User) ?? null;
  },

  async create(data: CreateUserInput): Promise<User> {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO users (email, password_hash, name, avatar) VALUES (?, ?, ?, ?)',
      [data.email ?? null, data.password_hash ?? null, data.name, data.avatar ?? null]
    );
    return (await this.findById(result.insertId))!;
  },
};
