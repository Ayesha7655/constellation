export interface DbSeeder {
  /** CLI filter id, e.g. `super-admin` for `pnpm db:seed super-admin`. */
  readonly name: string;
  readonly description: string;
  run(): Promise<void>;
}
