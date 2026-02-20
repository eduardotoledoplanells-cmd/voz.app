'use client';

import { useEffect, useRef, useState } from 'react';

interface TouchControlsProps {
    onDirectionChange: (direction: { x: number; y: number }) => void;
    onShoot: () => void;
    onAction: () => void;
    showActionButton?: boolean;
    showJoystick?: boolean;
    actionButtonText?: string;
    actionButtonIcon?: React.ReactNode;
    shootButtonText?: string;
    shootButtonIcon?: React.ReactNode;
    bottomOffset?: string;
    variant?: 'default' | 'nes';
}

export default function TouchControls({
    onDirectionChange,
    onShoot,
    onAction,
    showActionButton = true,
    showJoystick = true,
    shootButtonText = 'B',
    shootButtonIcon = null,
    actionButtonText = 'A',
    actionButtonIcon = null,
    bottomOffset = '20px',
    variant = 'nes'
}: TouchControlsProps) {
    const joystickRef = useRef<HTMLDivElement>(null);
    const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
    const [isTouchDevice, setIsTouchDevice] = useState(false);

    useEffect(() => {
        const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        setIsTouchDevice(isTouch);
    }, []);

    const handleDpad = (direction: string, isPressed: boolean) => {
        let x = 0;
        let y = 0;
        if (isPressed) {
            switch (direction) {
                case 'UP': y = -1; break;
                case 'DOWN': y = 1; break;
                case 'LEFT': x = -1; break;
                case 'RIGHT': x = 1; break;
            }
        }
        onDirectionChange({ x, y });
    };

    const handleJoystickMove = (e: React.TouchEvent<HTMLDivElement>) => {
        if (!joystickRef.current) return;
        const touch = e.touches[0];
        const rect = joystickRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const deltaX = touch.clientX - centerX;
        const deltaY = touch.clientY - centerY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const maxDistance = rect.width / 4;

        let x = deltaX;
        let y = deltaY;

        if (distance > maxDistance) {
            const angle = Math.atan2(deltaY, deltaX);
            x = Math.cos(angle) * maxDistance;
            y = Math.sin(angle) * maxDistance;
            onDirectionChange({ x: Math.cos(angle), y: Math.sin(angle) });
        } else {
            onDirectionChange({
                x: distance > 0 ? deltaX / maxDistance : 0,
                y: distance > 0 ? deltaY / maxDistance : 0
            });
        }
        setJoystickPosition({ x, y });
    };

    const handleJoystickEnd = () => {
        setJoystickPosition({ x: 0, y: 0 });
        onDirectionChange({ x: 0, y: 0 });
    };

    if (!isTouchDevice) return null;

    // Estilos NES
    const dpadButtonStyle = {
        width: '40px',
        height: '40px',
        background: '#111',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        touchAction: 'none' as any,
        cursor: 'pointer',
        border: 'none',
        outline: 'none',
        borderRadius: '5px'
    };

    const nesButtonStyle = {
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        background: '#e60000',
        border: 'none',
        boxShadow: '0 4px 6px rgba(0,0,0,0.5)',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '1.2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        touchAction: 'none' as any,
        cursor: 'pointer'
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: bottomOffset,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            justifyContent: 'space-between', // Separar D-pad y Botones
            alignItems: 'flex-end',
            width: '100%',
            maxWidth: '500px', // Ancho máximo simulando la consola/mando
            padding: '20px',
            zIndex: 1000,
            pointerEvents: 'none' // Permitir clic a través del contenedor, reactivar en botones
        }}>

            {/* D-PAD (Left Side) - Only pointer events on itself */}
            <div style={{ pointerEvents: 'auto', position: 'relative', width: '120px', height: '120px' }}>
                <div style={{ position: 'absolute', top: '0', left: '40px', ...dpadButtonStyle }}
                    onTouchStart={() => handleDpad('UP', true)} onTouchEnd={() => handleDpad('UP', false)}
                    onMouseDown={() => handleDpad('UP', true)} onMouseUp={() => handleDpad('UP', false)}>⬆️</div>

                <div style={{ position: 'absolute', bottom: '0', left: '40px', ...dpadButtonStyle }}
                    onTouchStart={() => handleDpad('DOWN', true)} onTouchEnd={() => handleDpad('DOWN', false)}
                    onMouseDown={() => handleDpad('DOWN', true)} onMouseUp={() => handleDpad('DOWN', false)}>⬇️</div>

                <div style={{ position: 'absolute', top: '40px', left: '0', ...dpadButtonStyle }}
                    onTouchStart={() => handleDpad('LEFT', true)} onTouchEnd={() => handleDpad('LEFT', false)}
                    onMouseDown={() => handleDpad('LEFT', true)} onMouseUp={() => handleDpad('LEFT', false)}>⬅️</div>

                <div style={{ position: 'absolute', top: '40px', right: '0', ...dpadButtonStyle }}
                    onTouchStart={() => handleDpad('RIGHT', true)} onTouchEnd={() => handleDpad('RIGHT', false)}
                    onMouseDown={() => handleDpad('RIGHT', true)} onMouseUp={() => handleDpad('RIGHT', false)}>➡️</div>

                {/* Centro D-Pad */}
                <div style={{ position: 'absolute', top: '40px', left: '40px', width: '40px', height: '40px', background: '#111' }}></div>
            </div>

            {/* BUTTONS (Right Side) */}
            <div style={{ pointerEvents: 'auto', display: 'flex', gap: '20px', marginBottom: '10px' }}>
                {/* B Button (Run/Fire) */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                    <button
                        onTouchStart={(e) => { e.preventDefault(); onShoot(); }}
                        onMouseDown={(e) => { e.preventDefault(); onShoot(); }}
                        style={nesButtonStyle}
                    >
                        {shootButtonIcon || shootButtonText}
                    </button>
                    <span style={{ color: 'white', fontWeight: 'bold', textShadow: '1px 1px 2px black' }}>B</span>
                </div>

                {/* A Button (Jump) - Only if showActionButton is true */}
                {showActionButton && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', marginTop: '-20px' }}>
                        <button
                            onTouchStart={(e) => { e.preventDefault(); onAction(); }}
                            onMouseDown={(e) => { e.preventDefault(); onAction(); }}
                            style={nesButtonStyle}
                        >
                            {actionButtonIcon || actionButtonText}
                        </button>
                        <span style={{ color: 'white', fontWeight: 'bold', textShadow: '1px 1px 2px black' }}>A</span>
                    </div>
                )}
            </div>
        </div>
    );
}
