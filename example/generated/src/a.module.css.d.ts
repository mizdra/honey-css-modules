declare const styles: Readonly<
  & { a_1: string }
  & { a_2: string }
  & { a_2: string }
  & { a_3: string }
  & (typeof import('./b.module.css'))['default']
  & Pick<(typeof import('./c.module.css'))['default'], 'c_1'>
  & { c_alias: (typeof import('./c.module.css'))['default']['c_2'] }
>;
export default styles;
