import React from 'react';

interface StableSliderProps {
    value: number;
    onValueChange: (val: number) => void;
    minimumValue?: number;
    maximumValue?: number;
    step?: number;
}

export const StableSlider: React.FC<StableSliderProps> = ({
    value,
    onValueChange,
    minimumValue = 0,
    maximumValue = 1,
    step = 0.01,
}) => {
    return (
        <input
            type="range"
            min={minimumValue}
            max={maximumValue}
            step={step}
            value={value}
            onChange={(e) => onValueChange(parseFloat(e.target.value))}
            style={{ width: '100%', cursor: 'pointer' }}
        />
    );
};
