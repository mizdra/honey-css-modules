export interface ResolverOptions {
  request: string;
}
export type Resolver = (specifier: string, options: ResolverOptions) => string | Promise<string>;
