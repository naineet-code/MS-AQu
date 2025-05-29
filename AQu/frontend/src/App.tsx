import React, { useEffect, useState, useRef } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Container, Typography, IconButton, Box } from '@mui/material';
import { ChatBox } from './components/ChatBox';
import { AestheticLoader } from './components/AestheticLoader';
import { loadBackendUrl } from './configLoader';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          minHeight: '100vh',
        },
      },
    },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    background: {
      default: '#121212',
    },
  },
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          minHeight: '100vh',
        },
      },
    },
  },
});

const AppContent: React.FC<{
  isDarkMode: boolean;
  onThemeToggle: () => void;
  onQuestionSubmit: (question: string) => Promise<{
    answer: string;
    citations: any[];
    reasoning: string;
    relevant_paragraphs: any[];
  }>;
}> = ({ isDarkMode, onThemeToggle, onQuestionSubmit }) => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography
          variant="h3"
          component="h1"
          sx={{
            fontWeight: 700,
            background: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
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
              marginRight: 8,
              letterSpacing: 1,
              fontSize: '1.2em',
            }}
          >
            Increff
          </span>
          FAQ for Reliance
        </Typography>
        <IconButton onClick={onThemeToggle} color="inherit">
          {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
      </Box>
      <ChatBox onQuestionSubmit={onQuestionSubmit} />
    </Container>
  );
};

const App: React.FC = () => {
  const [backendUrl, setBackendUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = sessionStorage.getItem('theme');
    return savedTheme === 'dark';
  });
  const hasInitialLoad = useRef(false);

  useEffect(() => {
    // Check if this is a theme toggle reload
    const isThemeToggle = sessionStorage.getItem('themeToggle') === 'true';
    if (isThemeToggle) {
      // Clear the flag and don't show loader
      sessionStorage.removeItem('themeToggle');
      setIsLoading(false);
    } else {
      // This is a fresh load or manual refresh, show loader
      setIsLoading(true);
    }
  }, []);

  useEffect(() => {
    if (!hasInitialLoad.current) {
      loadBackendUrl()
        .then(setBackendUrl)
        .catch((err) => setError(err.message));
      hasInitialLoad.current = true;
    }
  }, []);

  const handleThemeToggle = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    sessionStorage.setItem('theme', newTheme ? 'dark' : 'light');
    // Set the theme toggle flag before reload
    sessionStorage.setItem('themeToggle', 'true');
    window.location.reload();
  };

  const handleQuestionSubmit = async (question: string) => {
    if (!backendUrl) throw new Error('Backend URL not loaded');
    try {
      const response = await fetch(`${backendUrl}/api/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: question,
          category: "general"
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get answer');
      }

      const data = await response.json();
      return {
        answer: data.answer,
        citations: data.citations || [],
        reasoning: data.reasoning || '',
        relevant_paragraphs: data.relevant_paragraphs || []
      };
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  };

  if (error) {
    return <div>Error loading config: {error}</div>;
  }
  if (!backendUrl) {
    return <div>Loading configuration...</div>;
  }

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      {isLoading && <AestheticLoader onLoadComplete={() => setIsLoading(false)} />}
      <AppContent 
        isDarkMode={isDarkMode}
        onThemeToggle={handleThemeToggle}
        onQuestionSubmit={handleQuestionSubmit}
      />
    </ThemeProvider>
  );
};

export default App; 