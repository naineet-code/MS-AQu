import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { BackgroundGradientAnimation } from '@/components/ui/background-gradient-animation';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <BackgroundGradientAnimation
          gradientBackgroundStart="rgb(13, 13, 13)"
          gradientBackgroundEnd="rgb(30, 41, 59)"
          firstColor="59, 130, 246"
          secondColor="147, 51, 234"
          thirdColor="236, 72, 153"
          fourthColor="248, 113, 113"
          fifthColor="34, 197, 94"
          pointerColor="99, 102, 241"
          interactive={true}
        />
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 text-center px-4 max-w-md mx-auto"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 mb-4"
        >
          404
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-2xl font-semibold text-white mb-2"
        >
          Page Not Found
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-gray-300 mb-8"
        >
          The page you're looking for doesn't exist or has been moved.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Button>
          
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="flex items-center gap-2 border-white/20 text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFound; 