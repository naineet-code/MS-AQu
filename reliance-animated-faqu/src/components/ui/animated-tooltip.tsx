"use client";

import React, { useState } from "react";
import {
  motion,
  useTransform,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from "framer-motion";

export const AnimatedTooltip = ({
  items,
}: {
  items: {
    id: number;
    name: string;
    designation: string;
    image: string;
  }[];
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const springConfig = { stiffness: 100, damping: 5 };
  const x = useMotionValue(0); // going to set this value on mouse move
  // rotate the tooltip
  const rotate = useSpring(
    useTransform(x, [-100, 100], [-45, 45]),
    springConfig,
  );
  // translate the tooltip
  const translateX = useSpring(
    useTransform(x, [-100, 100], [-50, 50]),
    springConfig,
  );
  const handleMouseMove = (event: any) => {
    const halfWidth = event.target.offsetWidth / 2;
    x.set(event.nativeEvent.offsetX - halfWidth); // set the x value, which is then used in transform and rotate
  };

  return (
    <>
      {items.map((item, idx) => (
        <div
          className="group relative -mr-4"
          key={item.name}
          onMouseEnter={() => setHoveredIndex(item.id)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <AnimatePresence mode="popLayout">
            {hoveredIndex === item.id && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.6 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: {
                    type: "spring",
                    stiffness: 260,
                    damping: 10,
                  },
                }}
                exit={{ opacity: 0, y: 20, scale: 0.6 }}
                style={{
                  translateX: translateX,
                  rotate: rotate,
                  whiteSpace: "nowrap",
                }}
                className="absolute -top-16 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center justify-center rounded-md bg-black px-4 py-2 text-xs shadow-xl"
              >
                <div className="absolute inset-x-10 -bottom-px z-30 h-px w-[20%] bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
                <div className="absolute -bottom-px left-10 z-30 h-px w-[40%] bg-gradient-to-r from-transparent via-sky-500 to-transparent" />
                <div className="relative z-30 text-base font-bold text-white">
                  {item.name}
                </div>
                <div className="text-xs text-white">{item.designation}</div>
              </motion.div>
            )}
          </AnimatePresence>
          <img
            onMouseMove={handleMouseMove}
            height={100}
            width={100}
            src={item.image}
            alt={item.name}
            className="relative !m-0 h-14 w-14 rounded-full border-2 border-white object-cover object-top !p-0 transition duration-500 group-hover:z-30 group-hover:scale-105"
          />
        </div>
      ))}
    </>
  );
};

// Simple tooltip component for single-line messages
export const SimpleAnimatedTooltip = ({
  children,
  content,
  isDark = false,
  autoShow = false,
  autoShowDuration = 2000,
}: {
  children: React.ReactNode;
  content: string;
  isDark?: boolean;
  autoShow?: boolean;
  autoShowDuration?: number;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showAutoTooltip, setShowAutoTooltip] = useState(autoShow);
  const springConfig = { stiffness: 100, damping: 5 };
  const x = useMotionValue(0);
  
  // More subtle rotation and translation for a sleek look
  const rotate = useSpring(
    useTransform(x, [-100, 100], [-8, 8]),
    springConfig,
  );
  const translateX = useSpring(
    useTransform(x, [-100, 100], [-20, 20]),
    springConfig,
  );
  
  // Auto-hide tooltip after specified duration
  useEffect(() => {
    if (autoShow && showAutoTooltip) {
      const timer = setTimeout(() => {
        setShowAutoTooltip(false);
      }, autoShowDuration);
      return () => clearTimeout(timer);
    }
  }, [autoShow, autoShowDuration, showAutoTooltip]);
  
  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const halfWidth = rect.width / 2;
    x.set(event.clientX - rect.left - halfWidth);
  };

  // Show tooltip if either hovered or auto-show is active
  const shouldShowTooltip = isHovered || showAutoTooltip;

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
    >
      <AnimatePresence mode="wait">
        {shouldShowTooltip && (
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.9 }}
            animate={{
              opacity: 1,
              x: 0,
              scale: 1,
              transition: {
                type: "spring",
                stiffness: 260,
                damping: 15,
              },
            }}
            exit={{ opacity: 0, x: 5, scale: 0.95 }}
            style={{
              translateX: translateX,
              rotate: rotate,
              whiteSpace: "nowrap",
            }}
            className={`absolute right-full mr-4 top-1/2 -translate-y-1/2 z-50 px-6 py-2.5 rounded-full shadow-lg backdrop-blur-md ${
              isDark 
                ? 'bg-slate-900/20 text-white border border-white/20' 
                : 'bg-white/30 text-slate-800 border border-slate-900/10'
            }`}
          >
            {/* Subtle gradient line */}
            <div className="absolute inset-y-2 -right-px w-px bg-gradient-to-b from-transparent via-blue-500/30 to-transparent" />
            
            {/* Content with icon */}
            <div className="flex items-center gap-3 text-sm font-medium">
              {content}
            </div>
            
            {/* Arrow pointing right - positioned at the middle right of tooltip */}
            <div className={`absolute -right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rotate-45 backdrop-blur-md ${
              isDark ? 'bg-slate-900/20 border-t-2 border-r-2 border-white/20' : 'bg-white/30 border-t-2 border-r-2 border-slate-900/10'
            }`} />
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </div>
  );
}; 