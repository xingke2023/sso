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

  async findByUsername(username: string): Promise<User | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    return (rows[0] as User) ?? null;
  },

  async create(data: CreateUserInput): Promise<User> {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO users (email, username, password_hash, name, avatar) VALUES (?, ?, ?, ?, ?)',
      [data.email ?? null, data.username ?? null, data.password_hash ?? null, data.name ?? '', data.avatar ?? null]
    );
    return (await this.findById(result.insertId))!;
  },

  async update(id: number, data: { name?: string; avatar?: string }): Promise<User> {
    const fields: string[] = [];
    const values: unknown[] = [];
    if (data.name  !== undefined) { fields.push('name = ?');   values.push(data.name); }
    if (data.avatar !== undefined) { fields.push('avatar = ?'); values.push(data.avatar); }
    if (fields.length) {
      values.push(id);
      await pool.query<ResultSetHeader>(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    return (await this.findById(id))!;
  },
};
