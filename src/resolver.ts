export interface ResolverOptions {
  request: string;
}
// TODO: As resolver only processes synchronously, it is not necessary to allow `Promise`
export type Resolver = (specifier: string, options: ResolverOptions) => string | Promise<string>;
