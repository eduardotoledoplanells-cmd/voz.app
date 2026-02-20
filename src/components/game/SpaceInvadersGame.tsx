'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import TouchControls from './TouchControls';

export default function SpaceInvadersGame() {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const { user, updateUser } = useAuth();
    const activeKeysRef = useRef<Set<string>>(new Set());

    // Focus logic to ensure keyboard works
    const focusGame = () => {
        if (iframeRef.current) {
            iframeRef.current.focus();
            if (iframeRef.current.contentWindow) {
                iframeRef.current.contentWindow.focus();
            }
        }
    };

    // Auto-select 1 player mode when game loads
    useEffect(() => {
        const timer = setTimeout(() => {
            // Simulate pressing "1" to select 1 player mode
            simulateKey('1', true);
            setTimeout(() => simulateKey('1', false), 100);
        }, 1500); // Wait 1.5 seconds for game to load

        return () => clearTimeout(timer);
    }, []);

    return (
        <div style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            background: '#000',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            <iframe
                ref={iframeRef}
                src="/space-invaders/html5-space-invaders-master/index.html"
                style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    display: 'block'
                }}
                title="Space Invaders"
                onLoad={focusGame}
            />

            {/* Overlay for instructions if needed, currently keeping it clean */}
            <div
                onClick={focusGame}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    pointerEvents: 'none',
                }}
            />

            {/* Touch Controls for Mobile */}
            <TouchControls
                onDirectionChange={(direction) => {
                    const threshold = 0.3;

                    // Solo horizontal para Space Invaders
                    if (direction.x > threshold) {
                        simulateKey('ArrowRight', true);
                        simulateKey('ArrowLeft', false);
                    } else if (direction.x < -threshold) {
                        simulateKey('ArrowLeft', true);
                        simulateKey('ArrowRight', false);
                    } else {
                        simulateKey('ArrowLeft', false);
                        simulateKey('ArrowRight', false);
                    }
                }}
                onShoot={() => {
                    simulateKey(' ', true);
                    setTimeout(() => simulateKey(' ', false), 100);
                }}
                onAction={() => {
                    // Space Invaders no usa botón de acción
                }}
                showActionButton={false}
            />
        </div>
    );

    function simulateKey(key: string, isPressed: boolean) {
        if (!iframeRef.current?.contentWindow) return;

        try {
            const eventType = isPressed ? 'keydown' : 'keyup';
            const event = new KeyboardEvent(eventType, {
                key: key,
                code: key === ' ' ? 'Space' : key,
                keyCode: getKeyCode(key),
                which: getKeyCode(key),
                bubbles: true,
                cancelable: true
            });

            iframeRef.current.contentWindow.document.dispatchEvent(event);

            if (isPressed) {
                activeKeysRef.current.add(key);
            } else {
                activeKeysRef.current.delete(key);
            }
        } catch (e) {
            console.log('Could not simulate key:', e);
        }
    }

    function getKeyCode(key: string): number {
        const codes: Record<string, number> = {
            'ArrowLeft': 37,
            'ArrowRight': 39,
            ' ': 32,
            '1': 49
        };
        return codes[key] || 0;
    }
}
