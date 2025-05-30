"use client";

import React, { useEffect, useRef } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

interface SpringConfig {
  damping: number;
  stiffness: number;
  mass: number;
  restDelta: number;
}

interface SmoothCursorProps {
  className?: string;
  cursor?: React.JSX.Element;
  springConfig?: SpringConfig;
}

const DefaultCursorSVG = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.45 0 .67-.54.35-.85L6.35 2.86a.5.5 0 0 0-.85.35Z"
      fill="black"
      stroke="white"
      strokeWidth="2"
    />
  </svg>
);

const defaultSpringConfig: SpringConfig = {
  damping: 45,
  stiffness: 400,
  mass: 1,
  restDelta: 0.001,
};

export const SmoothCursor: React.FC<SmoothCursorProps> = ({
  className,
  cursor = <DefaultCursorSVG />,
  springConfig = defaultSpringConfig,
}) => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      
      // Show cursor when mouse moves
      if (cursorRef.current) {
        cursorRef.current.style.opacity = "1";
      }
    };

    const handleMouseLeave = () => {
      if (cursorRef.current) {
        cursorRef.current.style.opacity = "0";
      }
    };

    // Create and inject CSS to hide all cursors
    const style = document.createElement('style');
    style.id = 'smooth-cursor-styles';
    style.textContent = `
      *, *::before, *::after {
        cursor: none !important;
      }
      html, body {
        cursor: none !important;
      }
    `;
    document.head.appendChild(style);

    // Add event listeners
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      // Remove the injected styles
      const injectedStyle = document.getElementById('smooth-cursor-styles');
      if (injectedStyle) {
        injectedStyle.remove();
      }
      
      // Remove event listeners
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [mouseX, mouseY]);

  return (
    <motion.div
      ref={cursorRef}
      className={cn(
        "pointer-events-none fixed top-0 left-0 z-[9999]",
        className
      )}
      style={{
        x: springX,
        y: springY,
        translateX: "-50%",
        translateY: "-50%",
        opacity: 0,
      }}
    >
      <div className="drop-shadow-lg filter">
        {cursor}
      </div>
    </motion.div>
  );
}; 