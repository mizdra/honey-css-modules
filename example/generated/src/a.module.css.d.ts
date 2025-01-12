declare const styles = {
  /**
   * ```css
   * .a_1 { color: red; }
   * ```
   */
  a_1: '' as readonly string,
  /**
   * ```css
   * .a_2 { color: red; }
   * ```
   */
  a_2: '' as readonly string,
  /**
   * ```css
   * .a_2 { color: red; }
   * ```
   */
  a_2: '' as readonly string,
  a_3: '' as readonly string,
  ...(await import('./b.module.css')).default,
  c_1: (await import('./c.module.css')).default.c_1,
  c_alias: (await import('./c.module.css')).default.c_2,
  ...(await import('@/src/d.module.css')).default,
};
export default styles;
