import React from "react";
// import { useTheme } from "@/hooks/useTheme"; (no longer needed for 'u' styling)
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle } from "lucide-react";

interface PageTitleProps {
  isVisible: boolean;
}

const TextFlip: React.FC = () => {
  const texts = [
    "powered by AQu",
    "tailored for Reliance",
    "crafted by Increff"
  ];

  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [displayed, setDisplayed] = React.useState("");
  const [typing, setTyping] = React.useState(true);

  React.useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (typing) {
      if (displayed.length < texts[currentIndex].length) {
        timeout = setTimeout(() => {
          setDisplayed(texts[currentIndex].slice(0, displayed.length + 1));
        }, 50);
      } else {
        timeout = setTimeout(() => setTyping(false), 1200);
      }
    } else {
      timeout = setTimeout(() => {
        setDisplayed("");
        setTyping(true);
        setCurrentIndex((prev) => (prev + 1) % texts.length);
      }, 400);
    }
    return () => clearTimeout(timeout);
  }, [displayed, typing, currentIndex, texts]);

  return (
    <span
      className="absolute left-full bottom-0 ml-3 inline-flex items-center"
      style={{ minHeight: '1em', marginBottom: '10px' }}
    >
      <span
        className="px-2 py-0.5 rounded-2xl border bg-[#f5f6f7] border-[#e5e7eb] shadow-md text-[10px] md:text-xs font-semibold text-gray-400 whitespace-nowrap overflow-hidden text-ellipsis"
        style={{
          fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
          boxShadow: '0 2px 8px 0 rgba(60,60,60,0.07)',
          lineHeight: 1.1,
        }}
      >
        {displayed}
        <span className="animate-pulse">|</span>
      </span>
    </span>
  );
};

const PageTitle: React.FC<PageTitleProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <motion.div
      className="relative text-center mb-10 w-full"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      <div className="flex flex-row items-end gap-0 w-full min-h-[4.5rem] justify-center relative" style={{ marginLeft: '-32px' }}>
        <span className="relative inline-block">
          <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/90 drop-shadow-2xl">
            FAQ
          </h1>
          <TextFlip />
        </span>
      </div>
    </motion.div>
  );
};

export default PageTitle;
