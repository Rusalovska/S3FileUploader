import type { UserEntity, CreateUserInput } from "../domain/user";

export interface UserRepository {
  create(input: CreateUserInput): Promise<UserEntity>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findById(id: string): Promise<UserEntity | null>;
}