'use client';

import { useState, useEffect } from 'react';
import styles from './HeroSlider.module.css';

const slides = [
    {
        id: 1,
        image: '/images/banners/banner1.png',
        title: 'Compra y Vende',
        alt: 'Compra y vende tecnología y videojuegos'
    },
    {
        id: 2,
        image: '/images/banners/banner2.png',
        title: 'Retro Gaming',
        alt: 'Expertos en videojuegos retro y consolas clásicas'
    },
    {
        id: 3,
        image: '/images/banners/banner3.png',
        title: 'Mejores Precios',
        alt: 'Tecnología reacondicionada al mejor precio'
    },
    {
        id: 4,
        image: '/images/banners/banner4.png',
        title: 'Electrónica',
        alt: 'Smartphones, tablets y portátiles'
    },
    {
        id: 5,
        image: '/images/banners/banner5.png',
        title: 'Música y Vinilos',
        alt: 'La mejor selección de música y audio'
    },
    {
        id: 6,
        image: '/images/banners/banner6.png',
        title: 'Cine y Películas',
        alt: 'Películas en DVD y Blu-ray'
    }
];

export default function HeroSlider() {
    const [currentSlide, setCurrentSlide] = useState(0);

    // Auto-advance
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    };

    const goToSlide = (index: number) => {
        setCurrentSlide(index);
    };

    return (
        <div className={styles.heroContainer}>
            <div className={styles.slider}>
                {slides.map((slide, index) => (
                    <div
                        key={slide.id}
                        className={`${styles.slide} ${index === currentSlide ? styles.active : ''}`}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={slide.image} alt={slide.alt} className={styles.image} />
                    </div>
                ))}

                <div className={styles.controls}>
                    <button className={styles.controlButton} onClick={prevSlide} aria-label="Anterior">
                        ←
                    </button>
                    <button className={styles.controlButton} onClick={nextSlide} aria-label="Siguiente">
                        →
                    </button>
                </div>

                <div className={styles.dots}>
                    {slides.map((_, index) => (
                        <div
                            key={index}
                            className={`${styles.dot} ${index === currentSlide ? styles.dotActive : ''}`}
                            onClick={() => goToSlide(index)}
                        />
                    ))}
                </div>
            </div>

            <div className={styles.infoBox}>
                <div className={styles.infoContent}>
                    <h2 className={styles.infoTitle}>Compra y Vende con Confianza</h2>
                    <p className={styles.infoText}>
                        Tu marketplace de tecnología y videojuegos retro. Encuentra las mejores ofertas o vende tus productos de forma segura.
                    </p>
                    <ul className={styles.infoList}>
                        <li>✓ Transacciones seguras</li>
                        <li>✓ Productos verificados</li>
                        <li>✓ Envío rápido</li>
                        <li>✓ Soporte 24/7</li>
                    </ul>
                    <div className={styles.infoButtons}>
                        <a href="/tienda" className={styles.btnPrimary}>Explorar Tienda</a>
                        <a href="/sell" className={styles.btnSecondary}>Vender Ahora</a>
                    </div>
                </div>
            </div>
        </div>
    );
}
