import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
    strokeWidth?: number;
}

export function NewArrivalIcon({ className, strokeWidth = 1.8, ...props }: IconProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            {...props}
        >
            {/* 4-pointed star — upper right */}
            <path d="M16 3L17.2 5.8L20 7L17.2 8.2L16 11L14.8 8.2L12 7L14.8 5.8Z" />
            {/* Comet tail — three diagonal lines sweeping to lower left */}
            <line x1="12.5" y1="9" x2="2" y2="20" />
            <line x1="10.5" y1="10" x2="1.5" y2="18.5" />
            <line x1="12" y1="12" x2="3.5" y2="22" />
        </svg>
    );
}
