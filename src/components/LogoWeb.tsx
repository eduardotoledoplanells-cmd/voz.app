"use client";

import React from 'react';

interface LogoWebProps {
    size?: 'small' | 'medium' | 'large';
    height?: number | string;
    style?: React.CSSProperties;
    className?: string;
}

export default function LogoWeb({ size = 'medium', height, style, className }: LogoWebProps) {
    const fontSizeMap = {
        small: '26px',
        medium: '34px',
        large: '44px'
    };

    const finalFontSize = typeof height === 'number' ? `${height}px` : height || fontSizeMap[size];

    return (
        <span 
            className={className}
            style={{
                fontSize: finalFontSize,
                fontWeight: 900,
                letterSpacing: '-0.05em',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
                background: 'linear-gradient(135deg, #FFFFFF 0%, #F3E8FF 35%, #C084FC 70%, #9333EA 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 16px rgba(168, 85, 247, 0.55))',
                lineHeight: 1,
                display: 'inline-flex',
                alignItems: 'center',
                userSelect: 'none',
                verticalAlign: 'middle',
                ...style
            }}
        >
            LYVO
        </span>
    );
}
