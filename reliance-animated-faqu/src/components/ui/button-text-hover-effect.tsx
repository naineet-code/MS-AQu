"use client";
import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";

export const ButtonTextHoverEffect = ({
  text,
  duration = 0.3,
  className = "",
}: {
  text: string;
  duration?: number;
  className?: string;
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [maskPosition, setMaskPosition] = useState({ cx: "50%", cy: "50%" });

  useEffect(() => {
    if (svgRef.current && cursor.x !== null && cursor.y !== null) {
      const svgRect = svgRef.current.getBoundingClientRect();
      const cxPercentage = ((cursor.x - svgRect.left) / svgRect.width) * 100;
      const cyPercentage = ((cursor.y - svgRect.top) / svgRect.height) * 100;
      setMaskPosition({
        cx: `${cxPercentage}%`,
        cy: `${cyPercentage}%`,
      });
    }
  }, [cursor]);

  return (
    <div className={`relative inline-block ${className}`}>
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox="0 0 120 20"
        xmlns="http://www.w3.org/2000/svg"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onMouseMove={(e) => setCursor({ x: e.clientX, y: e.clientY })}
        className="select-none absolute inset-0"
        style={{ pointerEvents: 'none' }}
      >
        <defs>
          <linearGradient
            id={`buttonTextGradient-${text.replace(/\s/g, '')}`}
            gradientUnits="userSpaceOnUse"
            cx="50%"
            cy="50%"
            r="30%"
          >
            {hovered && (
              <>
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="25%" stopColor="#06b6d4" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="75%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#ec4899" />
              </>
            )}
          </linearGradient>

          <motion.radialGradient
            id={`buttonRevealMask-${text.replace(/\s/g, '')}`}
            gradientUnits="userSpaceOnUse"
            r="25%"
            initial={{ cx: "50%", cy: "50%" }}
            animate={maskPosition}
            transition={{ duration, ease: "easeOut" }}
          >
            <stop offset="0%" stopColor="white" />
            <stop offset="100%" stopColor="black" />
          </motion.radialGradient>
          
          <mask id={`buttonTextMask-${text.replace(/\s/g, '')}`}>
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill={`url(#buttonRevealMask-${text.replace(/\s/g, '')})`}
            />
          </mask>
        </defs>
        
        {/* Background stroke text */}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          strokeWidth="0.5"
          className="fill-transparent stroke-current font-medium text-sm"
          style={{ opacity: hovered ? 0.8 : 0 }}
        >
          {text}
        </text>
        
        {/* Animated stroke effect */}
        <motion.text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          strokeWidth="0.3"
          className="fill-transparent stroke-current font-medium text-sm"
          initial={{ strokeDashoffset: 200, strokeDasharray: 200 }}
          animate={{
            strokeDashoffset: hovered ? 0 : 200,
            strokeDasharray: 200,
          }}
          transition={{
            duration: 0.8,
            ease: "easeInOut",
          }}
        >
          {text}
        </motion.text>
        
        {/* Gradient reveal text */}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          stroke={`url(#buttonTextGradient-${text.replace(/\s/g, '')})`}
          strokeWidth="0.3"
          mask={`url(#buttonTextMask-${text.replace(/\s/g, '')})`}
          className="fill-transparent font-medium text-sm"
        >
          {text}
        </text>
      </svg>
      
      {/* Fallback text for accessibility */}
      <span className="text-base font-medium" style={{ opacity: hovered ? 0 : 1 }}>
        {text}
      </span>
    </div>
  );
}; 