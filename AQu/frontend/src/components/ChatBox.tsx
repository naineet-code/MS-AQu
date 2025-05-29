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

const SectionHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  background: 'linear-gradient(90deg, #7c3aed 0%, #a78bfa 100%)',
  color: 'white',
  px: 3,
  py: 1.5,
  cursor: 'pointer',
  userSelect: 'none',
  borderRadius: '8px 8px 0 0',
}));

const SectionContent = styled(Box)(({ theme }) => ({
  backgroundColor: 'rgba(124, 58, 237, 0.08)',
  px: 3,
  py: 2,
  color: 'text.primary',
  fontFamily: 'inherit',
  fontSize: '1rem',
  borderRadius: '0 0 8px 8px',
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

const PageLink = styled('a')(({ theme }) => ({
  color: theme.palette.primary.main,
  textDecoration: 'none',
  fontWeight: 500,
  marginLeft: theme.spacing(1),
  '&:hover': {
    textDecoration: 'underline',
  },
}));

const RelevantSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  '& .section-header': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(1, 2),
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    borderRadius: '4px',
    marginBottom: theme.spacing(1),
  },
  '& .section-content': {
    padding: theme.spacing(2),
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: '4px',
  },
}));

const UsageStats = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  padding: theme.spacing(2),
  backgroundColor: 'rgba(0, 0, 0, 0.02)',
  borderRadius: '8px',
  '& .stat-row': {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(1),
    '&:last-child': {
      marginBottom: 0,
    },
  },
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
    usage: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
    cost: {
      input_cost: number;
      output_cost: number;
      total_cost: number;
    };
    model: string;
  }>;
}

export const ChatBox: React.FC<ChatBoxProps> = ({ onQuestionSubmit }) => {
  const [mode, setMode] = useState<ChatMode>('idle');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [citations, setCitations] = useState<any[]>([]);
  const [reasoning, setReasoning] = useState('');
  const [relevantParagraphs, setRelevantParagraphs] = useState<any[]>([]);
  const [usageStats, setUsageStats] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});

  const handleSubmit = async () => {
    if (!question.trim()) return;

    setMode('loading');
    try {
      const result = await onQuestionSubmit(question);
      setAnswer(result.answer);
      setCitations(result.citations);
      setReasoning(result.reasoning);
      setRelevantParagraphs(result.relevant_paragraphs);
      setUsageStats({
        model: result.model,
        usage: result.usage,
        cost: result.cost
      });
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

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
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

  const renderRelevantSections = () => {
    if (!relevantParagraphs.length) return null;

    return (
      <CollapsibleSection title="Relevant Sections" defaultOpen={true}>
        {relevantParagraphs.map((para, index) => {
          const sectionId = `section-${index}`;
          const isExpanded = expandedSections[sectionId];
          
          return (
            <RelevantSection key={index}>
              <Box className="section-header">
                <Typography variant="subtitle1">
                  Section {index + 1}
                  {para.pages && para.pages.length > 0 && (
                    <PageLink href={`/pdf/${para.category || 'reliance'}/${para.filename || 'reliance_faq.pdf'}#page=${para.pages[0]}`} target="_blank">
                      (Page {para.pages.join(', ')})
                    </PageLink>
                  )}
                </Typography>
                <IconButton size="small" onClick={() => toggleSection(sectionId)}>
                  <ExpandMoreIcon sx={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }} />
                </IconButton>
              </Box>
              {isExpanded && (
                <Box className="section-content">
                  <Typography variant="body1" component="div">
                    {para.text}
                  </Typography>
                </Box>
              )}
            </RelevantSection>
          );
        })}
      </CollapsibleSection>
    );
  };

  const renderUsageStats = () => {
    if (!usageStats) return null;

    return (
      <UsageStats>
        <Typography variant="subtitle2" color="primary" gutterBottom>
          Usage Statistics
        </Typography>
        <Box className="stat-row">
          <Typography variant="body2">Model:</Typography>
          <Typography variant="body2">{usageStats.model}</Typography>
        </Box>
        <Box className="stat-row">
          <Typography variant="body2">Prompt Tokens:</Typography>
          <Typography variant="body2">{usageStats.usage.prompt_tokens}</Typography>
        </Box>
        <Box className="stat-row">
          <Typography variant="body2">Completion Tokens:</Typography>
          <Typography variant="body2">{usageStats.usage.completion_tokens}</Typography>
        </Box>
        <Box className="stat-row">
          <Typography variant="body2">Total Tokens:</Typography>
          <Typography variant="body2">{usageStats.usage.total_tokens}</Typography>
        </Box>
        <Box className="stat-row">
          <Typography variant="body2">Input Cost:</Typography>
          <Typography variant="body2">${usageStats.cost.input_cost.toFixed(6)}</Typography>
        </Box>
        <Box className="stat-row">
          <Typography variant="body2">Output Cost:</Typography>
          <Typography variant="body2">${usageStats.cost.output_cost.toFixed(6)}</Typography>
        </Box>
        <Box className="stat-row">
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Total Cost:</Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>${usageStats.cost.total_cost.toFixed(6)}</Typography>
        </Box>
      </UsageStats>
    );
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

      <AnimatePresence mode="wait">
        {mode === 'response' && (
          <ResponseContainer
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Answer Section */}
            <CollapsibleSection title="Answer" defaultOpen={true}>
              <Typography variant="body1" component="div" sx={{ whiteSpace: 'pre-wrap' }}>
                {answer}
              </Typography>
            </CollapsibleSection>

            {/* Reasoning Section */}
            <CollapsibleSection title="Reasoning" defaultOpen={false}>
              <Typography variant="body2" color="text.secondary">
                {reasoning}
              </Typography>
            </CollapsibleSection>

            {/* Relevant Sections */}
            {renderRelevantSections()}

            {/* Usage Statistics */}
            {renderUsageStats()}
          </ResponseContainer>
        )}
      </AnimatePresence>
    </ChatContainer>
  );
}; 