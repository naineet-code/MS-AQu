"use client";
import React, { useRef, useState, useEffect } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionTemplate,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { cn } from "@/lib/utils";
import {
  motion as framerMotion,
  useAnimationFrame as framerUseAnimationFrame,
  useMotionTemplate as framerUseMotionTemplate,
  useMotionValue as framerUseMotionValue,
  useTransform as framerUseTransform,
} from "framer-motion";

export function Button({
  borderRadius = "1.75rem",
  children,
  as: Component = "button",
  containerClassName,
  borderClassName,
  duration,
  className,
  ...otherProps
}: {
  borderRadius?: string;
  children: React.ReactNode;
  as?: any;
  containerClassName?: string;
  borderClassName?: string;
  duration?: number;
  className?: string;
  [key: string]: any;
}) {
  return (
    <Component
      className={cn(
        "relative h-16 w-40 overflow-hidden bg-transparent p-[1px] text-xl",
        containerClassName,
      )}
      style={{
        borderRadius: borderRadius,
      }}
      {...otherProps}
    >
      <div
        className="absolute inset-0"
        style={{ borderRadius: `calc(${borderRadius} * 0.96)` }}
      >
        <MovingBorder duration={duration} rx="30%" ry="30%">
          <div
            className={cn(
              "h-20 w-20 bg-[radial-gradient(#0ea5e9_40%,transparent_60%)] opacity-[0.8]",
              borderClassName,
            )}
          />
        </MovingBorder>
      </div>

      <div
        className={cn(
          "relative flex h-full w-full items-center justify-center border border-slate-800 bg-slate-900/[0.8] text-sm text-white antialiased backdrop-blur-xl",
          className,
        )}
        style={{
          borderRadius: `calc(${borderRadius} * 0.96)`,
        }}
      >
        {children}
      </div>
    </Component>
  );
}

export const MovingBorder = ({
  children,
  duration = 8000,
  rx = 16,
  ry = 16,
  ...otherProps
}: {
  children: React.ReactNode;
  duration?: number;
  rx?: number;
  ry?: number;
  [key: string]: any;
}) => {
  const pathRef = useRef<SVGRectElement>(null);
  const progress = useMotionValue(0);

  useEffect(() => {
    if (pathRef.current) {
      const length = pathRef.current.getTotalLength();
      progress.set(0);
    }
  }, []);

  useAnimationFrame((time) => {
    if (pathRef.current) {
      const length = pathRef.current.getTotalLength();
      const pxPerMillisecond = length / duration;
      progress.set((time * 0.5 * pxPerMillisecond) % length); // Reduced speed by multiplying by 0.5
    }
  });

  const x = useTransform(
    progress,
    (val) => pathRef.current?.getPointAtLength(val).x ?? 0
  );
  const y = useTransform(
    progress,
    (val) => pathRef.current?.getPointAtLength(val).y ?? 0
  );

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-neutral-950 p-3 md:p-4",
        otherProps.className
      )}
    >
      <div className="relative z-10">{children}</div>
      <motion.div
        className="absolute inset-0"
        style={{
          x,
          y,
        }}
      >
        <svg
          width="100%"
          height="100%"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
          }}
        >
          <rect
            ref={pathRef}
            width="100%"
            height="100%"
            rx={rx}
            ry={ry}
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="2"
            strokeDasharray={0}
            pathLength={1}
          />
          <defs>
            <linearGradient
              id="gradient"
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="0"
              x2="100%"
              y2="0"
            >
              <stop stopColor="rgba(255,255,255,0.6)" />
              <stop offset="1" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>
    </div>
  );
};