import styles from './a.module.css';

styles.a_1; // OK
styles.a_2; // OK
styles.a_3; // OK in editor, but NG in `tsc`
