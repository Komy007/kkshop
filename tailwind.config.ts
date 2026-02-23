import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
                "cosmic-dark": "linear-gradient(180deg, #09090b 0%, #17151e 100%)",
                "glass-gradient": "linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)",
            },
            colors: {
                space: {
                    900: "#09090b", // Deep space black
                    800: "#17151e", // Dark violet-gray
                    700: "#272431",
                    400: "#8b85a1", // Muted cosmic light
                    100: "#e6e4ec", // Starlight white
                },
                brand: {
                    primary: "#6366f1", // Indigo
                    secondary: "#ec4899", // Pink (cosmetics vibe)
                    accent: "#06b6d4", // Cyan
                }
            },
            animation: {
                "float-slow": "float 6s ease-in-out infinite",
                "float-medium": "float 4s ease-in-out infinite",
                "float-fast": "float 3s ease-in-out infinite",
                "pulse-glow": "pulse-glow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                "aurora": "aurora 15s linear infinite",
            },
            keyframes: {
                float: {
                    "0%, 100%": { transform: "translateY(0)" },
                    "50%": { transform: "translateY(-20px)" },
                },
                "pulse-glow": {
                    "0%, 100%": { opacity: "1", filter: "drop-shadow(0 0 15px rgba(99, 102, 241, 0.4))" },
                    "50%": { opacity: ".5", filter: "drop-shadow(0 0 5px rgba(99, 102, 241, 0.1))" },
                },
                aurora: {
                    "0%": { backgroundPosition: "0% 50%" },
                    "50%": { backgroundPosition: "100% 50%" },
                    "100%": { backgroundPosition: "0% 50%" },
                }
            },
        },
    },
    plugins: [],
};
export default config;
