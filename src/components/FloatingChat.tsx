'use client';

import React, { useState } from 'react';

/**
 * Floating Chat Icons — Telegram + Facebook Messenger
 * Position: bottom-right, above BottomTabBar on mobile
 * Deep links to each messenger
 */

const TELEGRAM_URL = 'https://t.me/kkshop_cc';
const MESSENGER_URL = 'https://m.me/kkshopcc';

// Inline SVG icons since lucide-react doesn't have brand icons
function TelegramIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
    );
}

function MessengerIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.3 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8.2l3.131 3.259L19.752 8.2l-6.561 6.763z" />
        </svg>
    );
}

export default function FloatingChat() {
    const [expanded, setExpanded] = useState(false);

    return (
        <div
            className="fixed right-4 z-[45] flex flex-col items-end gap-3 transition-all duration-300 bottom-[88px] md:bottom-6"
            onMouseEnter={() => setExpanded(true)}
            onMouseLeave={() => setExpanded(false)}
        >
            {/* Telegram */}
            <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={`group flex items-center gap-2 transition-all duration-300 ${expanded ? 'opacity-100 translate-y-0' : 'opacity-100 translate-y-0'
                    }`}
                aria-label="Chat on Telegram"
            >
                {expanded && (
                    <span className="bg-space-800/90 backdrop-blur-md text-white text-xs font-medium px-3 py-1.5 rounded-full border border-white/10 animate-fade-in whitespace-nowrap">
                        Telegram
                    </span>
                )}
                <div className="w-12 h-12 rounded-full bg-[#26A5E4] text-white flex items-center justify-center shadow-lg hover:shadow-[0_0_20px_rgba(38,165,228,0.4)] hover:scale-110 transition-all duration-200 active:scale-95">
                    <TelegramIcon className="w-6 h-6" />
                </div>
            </a>

            {/* Facebook Messenger */}
            <a
                href={MESSENGER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 transition-all duration-300"
                aria-label="Chat on Messenger"
            >
                {expanded && (
                    <span className="bg-space-800/90 backdrop-blur-md text-white text-xs font-medium px-3 py-1.5 rounded-full border border-white/10 animate-fade-in whitespace-nowrap">
                        Messenger
                    </span>
                )}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00B2FF] to-[#006AFF] text-white flex items-center justify-center shadow-lg hover:shadow-[0_0_20px_rgba(0,106,255,0.4)] hover:scale-110 transition-all duration-200 active:scale-95 animate-float-chat">
                    <MessengerIcon className="w-6 h-6" />
                </div>
            </a>
        </div>
    );
}
