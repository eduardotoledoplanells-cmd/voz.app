import styles from './Hero.module.css';

export default function Hero() {
    return (
        <section className={styles.hero}>
            <h1 className={styles.title}>Compra, Vende, Intercambia</h1>
            <p className={styles.subtitle}>La mejor tienda de segunda mano para juegos, móviles y tecnología.</p>
        </section>
    );
}
