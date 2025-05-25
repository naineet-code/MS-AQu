import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { styled } from '@mui/material/styles';
import { Box, TextField, IconButton, CircularProgress, Typography } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

type ChatMode = 'idle' | 'focused' | 'loading' | 'response';

const ChatContainer = styled(motion.div)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  maxWidth: '800px',
  margin: '0 auto',
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  borderRadius: '16px',
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  overflow: 'hidden',
  transition: 'all 0.3s ease',
}));

const InputContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const ResponseContainer = styled(motion.div)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: 'rgba(0, 0, 0, 0.02)',
  borderTop: '1px solid rgba(0, 0, 0, 0.1)',
}));

const CitationsContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(1),
  fontSize: '0.9rem',
  color: theme.palette.text.secondary,
}));

const Citation = styled(Box)(({ theme }) => ({
  display: 'inline-block',
  marginRight: theme.spacing(1),
  padding: theme.spacing(0.5, 1),
  backgroundColor: 'rgba(0, 0, 0, 0.05)',
  borderRadius: theme.spacing(1),
}));

// CollapsibleSection component for consistent style
const CollapsibleSection: React.FC<{
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}> = ({ title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Box sx={{ mb: 2, borderRadius: 2, overflow: 'hidden', boxShadow: open ? 2 : 0 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(90deg, #7c3aed 0%, #a78bfa 100%)',
          color: 'white',
          px: 3,
          py: 1.5,
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={() => setOpen((v) => !v)}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem', letterSpacing: 0.5 }}>{title}</Typography>
        <ExpandMoreIcon sx={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }} />
      </Box>
      {open && (
        <Box sx={{
          backgroundColor: 'rgba(124, 58, 237, 0.08)',
          px: 3,
          py: 2,
          color: 'text.primary',
          fontFamily: 'inherit',
          fontSize: '1rem',
        }}>
          {children}
        </Box>
      )}
    </Box>
  );
};

interface ChatBoxProps {
  onQuestionSubmit: (question: string) => Promise<{
    answer: string;
    citations: any[];
    reasoning: string;
    relevant_paragraphs: any[];
  }>;
}

export const ChatBox: React.FC<ChatBoxProps> = ({ onQuestionSubmit }) => {
  const [mode, setMode] = useState<ChatMode>('idle');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [citations, setCitations] = useState<any[]>([]);
  const [reasoning, setReasoning] = useState('');
  const [relevantParagraphs, setRelevantParagraphs] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!question.trim()) return;

    setMode('loading');
    try {
      const result = await onQuestionSubmit(question);
      setAnswer(result.answer);
      setCitations(result.citations);
      setReasoning(result.reasoning);
      setRelevantParagraphs(result.relevant_paragraphs);
      setMode('response');
    } catch (error) {
      console.error('Error submitting question:', error);
      setMode('focused');
    }
  };

  const handleNewQuestion = () => {
    setQuestion('');
    setAnswer('');
    setCitations([]);
    setReasoning('');
    setRelevantParagraphs([]);
    setMode('focused');
    inputRef.current?.focus();
  };

  const containerVariants = {
    idle: {
      y: '50vh',
      scale: 0.9,
      opacity: 0.8,
    },
    focused: {
      y: 0,
      scale: 1,
      opacity: 1,
    },
    loading: {
      y: 0,
      scale: 1,
      opacity: 1,
    },
    response: {
      y: 0,
      scale: 1,
      opacity: 1,
    },
  };

  return (
    <ChatContainer
      initial="idle"
      animate={mode}
      variants={containerVariants}
      transition={{ type: 'spring', stiffness: 100, damping: 15 }}
      onClick={() => mode === 'idle' && setMode('focused')}
    >
      <InputContainer>
        <TextField
          fullWidth
          variant="outlined"
          placeholder={mode === 'idle' ? 'Ask a question...' : 'Type your question...'}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onFocus={() => setMode('focused')}
          inputRef={inputRef}
          disabled={mode === 'loading'}
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
            },
          }}
        />
        {mode === 'response' ? (
          <IconButton onClick={handleNewQuestion} color="primary">
            <RefreshIcon />
          </IconButton>
        ) : (
          <IconButton
            onClick={handleSubmit}
            color="primary"
            disabled={!question.trim() || mode === 'loading'}
          >
            {mode === 'loading' ? (
              <CircularProgress size={24} />
            ) : (
              <SendIcon />
            )}
          </IconButton>
        )}
      </InputContainer>

      <AnimatePresence>
        {mode === 'response' && (
          <ResponseContainer
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Answer Section */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 1, color: 'primary.main' }}>Answer</Typography>
              <Box sx={{ 
                whiteSpace: 'pre-wrap',
                backgroundColor: 'rgba(0, 0, 0, 0.02)',
                p: 2,
                borderRadius: 1
              }}>{answer}</Box>
            </Box>

            {/* Reasoning Section (collapsible, visually matches Relevant Paragraphs) */}
            {reasoning && (
              <CollapsibleSection title="Reasoning">
                {reasoning}
              </CollapsibleSection>
            )}

            {/* Relevant Paragraphs Section (collapsible) */}
            {relevantParagraphs.length > 0 && (
              <CollapsibleSection title="Relevant Paragraphs">
                {relevantParagraphs.map((para, idx) => (
                  <Box key={idx} sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>{para.pages}</Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{para.text}</Typography>
                  </Box>
                ))}
              </CollapsibleSection>
            )}

            {/* References Section (collapsible) */}
            {citations.length > 0 && (
              <CollapsibleSection title="References">
                <CitationsContainer>
                  {citations.map((citation, index) => (
                    <Citation key={index}>
                      {citation.section && <strong>{citation.section}: </strong>}
                      {citation.text}
                      {citation.page && <span> (Page {citation.page})</span>}
                    </Citation>
                  ))}
                </CitationsContainer>
              </CollapsibleSection>
            )}
          </ResponseContainer>
        )}
      </AnimatePresence>
    </ChatContainer>
  );
}; 