import bcrypt from "bcryptjs";
import type { UserRepository } from "../repositories/user-repository.interface";
import type { TokenService } from "./token.service.interface";
import { BadRequestError } from "../domain/authorization.errors";

const SALT_ROUNDS = 12;

export interface AuthResult {
  token: string;
  user: { id: string; email: string; name: string | null };
}

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly tokens: TokenService
  ) {}

  async register(email: string, password: string, name?: string): Promise<AuthResult> {
    const existing = await this.users.findByEmail(email);
    if (existing) throw new BadRequestError("An account with this email already exists");

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await this.users.create({ email, passwordHash, name: name ?? null });

    const token = this.tokens.sign({ userId: user.id, email: user.email, groupIds: [] });
    return { token, user: { id: user.id, email: user.email, name: user.name } };
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await this.users.findByEmail(email);
    if (!user) throw new BadRequestError("Invalid email or password");

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new BadRequestError("Invalid email or password");

    const token = this.tokens.sign({ userId: user.id, email: user.email, groupIds: [] });
    return { token, user: { id: user.id, email: user.email, name: user.name } };
  }
}