import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'
import typography from '@tailwindcss/typography'

export default {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './index.html',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      containers: {
        'reading': '65ch',
        'content': '80ch', 
        'wide': '90ch',
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        first: {
          '0%, 100%': {
            transform: 'translate(0px, 0px) rotate(0deg)',
          },
          '33%': {
            transform: 'translate(30px, -50px) rotate(120deg)',
          },
          '66%': {
            transform: 'translate(-20px, 20px) rotate(240deg)',
          }
        },
        second: {
          '0%, 100%': {
            transform: 'translate(0px, 0px) rotate(360deg)',
          },
          '20%': {
            transform: 'translate(-20px, -30px) rotate(72deg)',
          },
          '40%': {
            transform: 'translate(-40px, 5px) rotate(144deg)',
          },
          '60%': {
            transform: 'translate(-20px, -10px) rotate(216deg)',
          },
          '80%': {
            transform: 'translate(5px, -30px) rotate(288deg)',
          }
        },
        third: {
          '0%, 100%': {
            transform: 'translate(0px, 0px) rotate(0deg)',
          },
          '30%': {
            transform: 'translate(20px, 10px) rotate(160deg)',
          },
          '60%': {
            transform: 'translate(-40px, -20px) rotate(320deg)',
          },
          '90%': {
            transform: 'translate(0px, -40px) rotate(480deg)',
          }
        },
        fourth: {
          '0%, 100%': {
            transform: 'translate(0px, 0px) rotate(0deg)',
          },
          '25%': {
            transform: 'translate(-25px, 0px) rotate(90deg)',
          },
          '50%': {
            transform: 'translate(-25px, -25px) rotate(180deg)',
          },
          '75%': {
            transform: 'translate(0px, -25px) rotate(270deg)',
          }
        },
        fifth: {
          '0%, 100%': {
            transform: 'translate(0px, 0px) rotate(0deg)',
          },
          '20%': {
            transform: 'translate(-10px, 10px) rotate(60deg)',
          },
          '40%': {
            transform: 'translate(-30px, 0px) rotate(120deg)',
          },
          '60%': {
            transform: 'translate(-30px, -30px) rotate(180deg)',
          },
          '80%': {
            transform: 'translate(0px, -30px) rotate(240deg)',
          }
        },
        sixth: {
          '0%, 100%': {
            transform: 'translate(0px, 0px) rotate(0deg)',
          },
          '50%': {
            transform: 'translate(40px, 40px) rotate(180deg)',
          }
        },
        seventh: {
          '0%, 100%': {
            transform: 'translate(0px, 0px) rotate(0deg)',
          },
          '25%': {
            transform: 'translate(30px, -30px) rotate(90deg)',
          },
          '50%': {
            transform: 'translate(-30px, -30px) rotate(180deg)',
          },
          '75%': {
            transform: 'translate(-30px, 30px) rotate(270deg)',
          }
        },
        eighth: {
          '0%, 100%': {
            transform: 'translate(0px, 0px) rotate(0deg)',
          },
          '33%': {
            transform: 'translate(-35px, 15px) rotate(120deg)',
          },
          '66%': {
            transform: 'translate(35px, -25px) rotate(240deg)',
          }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        first: "first 20s ease-in-out infinite",
        second: "second 18s ease-in-out infinite",
        third: "third 22s ease-in-out infinite",
        fourth: "fourth 25s ease-in-out infinite",
        fifth: "fifth 19s ease-in-out infinite",
        sixth: "sixth 16s ease-in-out infinite",
        seventh: "seventh 21s ease-in-out infinite",
        eighth: "eighth 23s ease-in-out infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate, typography],
} satisfies Config 