declare const styles = {
  a_1: '' as readonly string,
  a_2: '' as readonly string,
  a_2: '' as readonly string,
  a_3: '' as readonly string,
  ...(await import('./b.module.css')).default,
  c_1/*1*/: (await import('./c.module.css')).default.c_1,
  c_alias/*2*/: (await import('./c.module.css')).default.c_2,
};
export default styles;
