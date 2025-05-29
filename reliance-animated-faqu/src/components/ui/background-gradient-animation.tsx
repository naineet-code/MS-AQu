"use client";
import { cn } from "@/lib/utils";
import React, { useEffect, useRef, useState, useCallback } from "react";

export const BackgroundGradientAnimation = ({
  gradientBackgroundStart = "rgb(108, 0, 162)",
  gradientBackgroundEnd = "rgb(0, 17, 82)",
  firstColor = "18, 113, 255",
  secondColor = "221, 74, 255",
  thirdColor = "100, 220, 255",
  fourthColor = "200, 50, 50",
  fifthColor = "180, 180, 50",
  pointerColor = "140, 100, 255",
  size = "80%",
  blendingValue = "hard-light",
  children,
  className,
  interactive = true,
  containerClassName,
}: {
  gradientBackgroundStart?: string;
  gradientBackgroundEnd?: string;
  firstColor?: string;
  secondColor?: string;
  thirdColor?: string;
  fourthColor?: string;
  fifthColor?: string;
  pointerColor?: string;
  size?: string;
  blendingValue?: string;
  children?: React.ReactNode;
  className?: string;
  interactive?: boolean;
  containerClassName?: string;
}) => {
  const interactiveRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [curX, setCurX] = useState(0);
  const [curY, setCurY] = useState(0);
  const [tgX, setTgX] = useState(0);
  const [tgY, setTgY] = useState(0);
  
  // Simple CSS variable updates
  const updateCSSVariables = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const variables = {
      '--gradient-background-start': gradientBackgroundStart,
      '--gradient-background-end': gradientBackgroundEnd,
      '--first-color': firstColor,
      '--second-color': secondColor,
      '--third-color': thirdColor,
      '--fourth-color': fourthColor,
      '--fifth-color': fifthColor,
      '--pointer-color': pointerColor,
      '--size': size,
      '--blending-value': blendingValue,
    };

    Object.entries(variables).forEach(([key, value]) => {
      container.style.setProperty(key, value);
    });
  }, [
    gradientBackgroundStart,
    gradientBackgroundEnd,
    firstColor,
    secondColor,
    thirdColor,
    fourthColor,
    fifthColor,
    pointerColor,
    size,
    blendingValue,
  ]);

  useEffect(() => {
    updateCSSVariables();
  }, [updateCSSVariables]);

  useEffect(() => {
    function move() {
      if (!interactiveRef.current) return;
      setCurX(curX + (tgX - curX) / 15);
      setCurY(curY + (tgY - curY) / 15);
      interactiveRef.current.style.transform = `translate(${Math.round(curX)}px, ${Math.round(curY)}px)`;
    }
    move();
  }, [tgX, tgY, curX, curY]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTgX(event.clientX - rect.left);
      setTgY(event.clientY - rect.top);
    }
  };

  const [isSafari, setIsSafari] = useState(false);
  useEffect(() => {
    setIsSafari(/^((?!chrome|android).)*safari/i.test(navigator.userAgent));
  }, []);

  return (
    <div
      className={cn(
        "h-screen w-screen relative overflow-hidden top-0 left-0",
        containerClassName
      )}
      ref={containerRef}
      onMouseMove={interactive ? handleMouseMove : undefined}
    >
      <svg className="hidden">
        <defs>
          <filter id="blurMe">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>
      <div className={cn("", className)}>{children}</div>
      <div
        className={cn(
          "gradients-container h-full w-full blur-lg",
          isSafari ? "blur-2xl" : "[filter:url(#blurMe)_blur(40px)]"
        )}
      >
        <div
          className={cn(
            `absolute [background:radial-gradient(circle_at_center,_var(--first-color)_0,_var(--first-color)_50%)_no-repeat]`,
            `[mix-blend-mode:var(--blending-value)] w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]`,
            `[transform-origin:center_center]`,
            `animate-first`,
            `opacity-100`
          )}
        ></div>
        <div
          className={cn(
            `absolute [background:radial-gradient(circle_at_center,_rgba(var(--second-color),_0.8)_0,_rgba(var(--second-color),_0)_50%)_no-repeat]`,
            `[mix-blend-mode:var(--blending-value)] w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]`,
            `[transform-origin:calc(50%-400px)]`,
            `animate-second`,
            `opacity-100`
          )}
        ></div>
        <div
          className={cn(
            `absolute [background:radial-gradient(circle_at_center,_rgba(var(--third-color),_0.8)_0,_rgba(var(--third-color),_0)_50%)_no-repeat]`,
            `[mix-blend-mode:var(--blending-value)] w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]`,
            `[transform-origin:calc(50%+400px)]`,
            `animate-third`,
            `opacity-100`
          )}
        ></div>
        <div
          className={cn(
            `absolute [background:radial-gradient(circle_at_center,_rgba(var(--fourth-color),_0.8)_0,_rgba(var(--fourth-color),_0)_50%)_no-repeat]`,
            `[mix-blend-mode:var(--blending-value)] w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]`,
            `[transform-origin:calc(50%-200px)]`,
            `animate-fourth`,
            `opacity-70`
          )}
        ></div>
        <div
          className={cn(
            `absolute [background:radial-gradient(circle_at_center,_rgba(var(--fifth-color),_0.8)_0,_rgba(var(--fifth-color),_0)_50%)_no-repeat]`,
            `[mix-blend-mode:var(--blending-value)] w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]`,
            `[transform-origin:calc(50%-800px)_calc(50%+200px)]`,
            `animate-fifth`,
            `opacity-100`
          )}
        ></div>

        {/* Additional animated blobs for enhanced dynamics */}
        <div
          className={cn(
            `absolute [background:radial-gradient(circle_at_center,_rgba(var(--first-color),_0.8)_0,_rgba(var(--first-color),_0)_50%)_no-repeat]`,
            `[mix-blend-mode:var(--blending-value)] w-[calc(var(--size)*1.1)] h-[calc(var(--size)*1.1)] top-[calc(20%-var(--size)/4)] left-[calc(80%-var(--size)/4)]`,
            `[transform-origin:calc(50%+300px)_calc(50%-300px)]`,
            `animate-third`,
            `opacity-90`
          )}
        ></div>
        
        <div
          className={cn(
            `absolute [background:radial-gradient(circle_at_center,_rgba(var(--third-color),_0.9)_0,_rgba(var(--third-color),_0)_50%)_no-repeat]`,
            `[mix-blend-mode:var(--blending-value)] w-[calc(var(--size)*0.9)] h-[calc(var(--size)*0.9)] top-[calc(80%-var(--size)/3)] left-[calc(10%-var(--size)/3)]`,
            `[transform-origin:calc(50%-600px)_calc(50%+400px)]`,
            `animate-fifth`,
            `opacity-80`
          )}
        ></div>
        
        <div
          className={cn(
            `absolute [background:radial-gradient(circle_at_center,_rgba(var(--second-color),_0.85)_0,_rgba(var(--second-color),_0)_50%)_no-repeat]`,
            `[mix-blend-mode:var(--blending-value)] w-[calc(var(--size)*0.75)] h-[calc(var(--size)*0.75)] top-[calc(10%-var(--size)/5)] left-[calc(90%-var(--size)/5)]`,
            `[transform-origin:calc(50%+500px)_calc(50%-100px)]`,
            `animate-second`,
            `opacity-85`
          )}
        ></div>
        
        <div
          className={cn(
            `absolute [background:radial-gradient(circle_at_center,_rgba(var(--fourth-color),_0.75)_0,_rgba(var(--fourth-color),_0)_50%)_no-repeat]`,
            `[mix-blend-mode:var(--blending-value)] w-[calc(var(--size)*1.0)] h-[calc(var(--size)*1.0)] top-[calc(60%-var(--size)/2)] left-[calc(15%-var(--size)/2)]`,
            `[transform-origin:calc(50%-300px)_calc(50%+200px)]`,
            `animate-first`,
            `opacity-75`
          )}
        ></div>
        
        <div
          className={cn(
            `absolute [background:radial-gradient(circle_at_center,_rgba(var(--fifth-color),_0.8)_0,_rgba(var(--fifth-color),_0)_50%)_no-repeat]`,
            `[mix-blend-mode:var(--blending-value)] w-[calc(var(--size)*0.85)] h-[calc(var(--size)*0.85)] top-[calc(40%-var(--size)/2)] left-[calc(85%-var(--size)/2)]`,
            `[transform-origin:calc(50%+400px)_calc(50%+100px)]`,
            `animate-fourth`,
            `opacity-80`
          )}
        ></div>

        {interactive && (
          <div
            ref={interactiveRef}
            className={cn(
              `absolute [background:radial-gradient(circle_at_center,_rgba(var(--pointer-color),_0.9)_0,_rgba(var(--pointer-color),_0)_50%)_no-repeat]`,
              `[mix-blend-mode:var(--blending-value)] w-[calc(var(--size)*1.2)] h-[calc(var(--size)*1.2)]`,
              `opacity-60 pointer-events-none -top-1/2 -left-1/2`
            )}
          ></div>
        )}
      </div>
    </div>
  );
};
