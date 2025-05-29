import React, { useEffect, useState, useRef } from 'react';
import { Box, CircularProgress, useTheme } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

interface AestheticLoaderProps {
  onLoadComplete: () => void;
}

export const AestheticLoader: React.FC<AestheticLoaderProps> = ({ onLoadComplete }) => {
  const [show, setShow] = useState(true);
  const theme = useTheme();
  const hasShown = useRef(false);

  useEffect(() => {
    if (!hasShown.current) {
      // Random duration between 1.5 and 3.5 seconds
      const duration = Math.random() * 2000 + 1500;
      
      const timer = setTimeout(() => {
        setShow(false);
        onLoadComplete();
        hasShown.current = true;
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [onLoadComplete]);

  if (hasShown.current) {
    return null;
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(18, 18, 18, 0.9)' 
              : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <CircularProgress 
              size={60} 
              thickness={4} 
              sx={{ color: theme.palette.primary.main }}
            />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{
                fontSize: '1.2rem',
                fontWeight: 500,
                color: theme.palette.primary.main,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span
                style={{
                  fontWeight: 900,
                  background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  WebkitTextFillColor: 'transparent',
                  marginRight: 6,
                  letterSpacing: 1,
                  fontSize: '1.1em',
                }}
              >
                Increff
              </span>
              FAQ...
            </motion.div>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 