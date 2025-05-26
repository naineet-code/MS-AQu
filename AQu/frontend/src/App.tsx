import React, { useEffect, useState } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Container, Typography } from '@mui/material';
import { ChatBox } from './components/ChatBox';
import { loadBackendUrl } from './configLoader';

const theme = createTheme({
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

const App: React.FC = () => {
  const [backendUrl, setBackendUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBackendUrl()
      .then(setBackendUrl)
      .catch((err) => setError(err.message));
  }, []);

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
          category: "general"  // You may want to make this configurable
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
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography
          variant="h3"
          component="h1"
          align="center"
          gutterBottom
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
            backgroundClip: 'text',
            textFillColor: 'transparent',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 4,
          }}
        >
          FAQu for Reliance
        </Typography>
        <ChatBox onQuestionSubmit={handleQuestionSubmit} />
      </Container>
    </ThemeProvider>
  );
};

export default App; 