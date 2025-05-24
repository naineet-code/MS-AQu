import React, { useEffect, useRef } from 'react';

interface GeometricPatternAnimationProps {
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  patternSize?: number;
  animationSpeed?: number;
  interactive?: boolean;
}

export const GeometricPatternAnimation: React.FC<GeometricPatternAnimationProps> = ({
  primaryColor = "#FF6B35",
  secondaryColor = "#F7931E", 
  backgroundColor = "#2C3E50",
  patternSize = 60,
  animationSpeed = 0.5,
  interactive = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const timeRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const drawPattern = (time: number) => {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cols = Math.ceil(canvas.width / patternSize) + 1;
      const rows = Math.ceil(canvas.height / patternSize) + 1;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * patternSize;
          const y = j * patternSize;
          
          // Create wave-like animation
          const wave = Math.sin(time * animationSpeed + i * 0.1 + j * 0.1) * 0.5 + 0.5;
          
          // Mouse interaction effect
          let mouseEffect = 1;
          if (interactive) {
            const dx = x - mouseRef.current.x;
            const dy = y - mouseRef.current.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            mouseEffect = Math.max(0.3, 1 - distance / 200);
          }

          // Alternate between different geometric shapes
          const shapeType = (i + j) % 3;
          const size = patternSize * 0.3 * wave * mouseEffect;
          const alpha = 0.3 + wave * 0.4;

          ctx.save();
          ctx.translate(x + patternSize/2, y + patternSize/2);
          ctx.rotate(time * animationSpeed * 0.5 + i * 0.1);

          if (shapeType === 0) {
            // Hexagon
            drawHexagon(ctx, size, primaryColor, alpha);
          } else if (shapeType === 1) {
            // Triangle
            drawTriangle(ctx, size, secondaryColor, alpha);
          } else {
            // Circle
            drawCircle(ctx, size, primaryColor, alpha * 0.7);
          }

          ctx.restore();
        }
      }
    };

    const drawHexagon = (ctx: CanvasRenderingContext2D, size: number, color: string, alpha: number) => {
      ctx.fillStyle = color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const x = Math.cos(angle) * size;
        const y = Math.sin(angle) * size;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    };

    const drawTriangle = (ctx: CanvasRenderingContext2D, size: number, color: string, alpha: number) => {
      ctx.fillStyle = color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(-size * 0.866, size * 0.5);
      ctx.lineTo(size * 0.866, size * 0.5);
      ctx.closePath();
      ctx.fill();
    };

    const drawCircle = (ctx: CanvasRenderingContext2D, size: number, color: string, alpha: number) => {
      ctx.fillStyle = color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fill();
    };

    const animate = () => {
      timeRef.current += 0.016; // ~60fps
      drawPattern(timeRef.current);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (interactive) {
        mouseRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    resizeCanvas();
    animate();

    window.addEventListener('resize', resizeCanvas);
    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
      if (interactive) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [primaryColor, secondaryColor, backgroundColor, patternSize, animationSpeed, interactive]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'none'
      }}
    />
  );
};

export default GeometricPatternAnimation;