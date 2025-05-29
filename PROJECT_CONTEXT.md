# Project Context Documentation

## ⚠️ IMPORTANT INSTRUCTIONS FOR AI ASSISTANTS

**BEFORE MAKING ANY CHANGES TO THIS FILE:**
1. Always ask the user for permission before updating this context file
2. Explain what changes you want to make and why
3. Only update this file if the user explicitly approves the changes
4. When updating, preserve all existing information unless specifically told to remove it

---

## Project Overview

**Project Name:** Reliance Animated FAQ (AQu AI Service)  
**Type:** Interactive FAQ Web Application with AI-powered Q&A  
**Purpose:** Provide intelligent answers to user questions using AI backend with PDF document knowledge base  
**Client:** Increff Technologies Pvt. Ltd.  

## Technology Stack

### Frontend
- **Framework:** Next.js with React 18+ and TypeScript
- **Styling:** Tailwind CSS with custom animations
- **UI Components:** shadcn/ui component library
- **Animations:** Framer Motion for page transitions and micro-interactions
- **Theme System:** Custom dark/light theme toggle with system preference detection
- **Icons:** Lucide React icon library

### Backend Integration
- **API Communication:** RESTful API calls to backend service
- **Configuration:** TOML-based config file loading
- **PDF Handling:** Backend serves PDF documents for viewing

### Key Dependencies
```json
{
  "framer-motion": "Page transitions and animations",
  "marked": "Markdown parsing for AI responses",
  "@radix-ui/*": "Accessible UI primitives (via shadcn/ui)",
  "lucide-react": "Icon system",
  "tailwindcss": "Utility-first CSS framework"
}
```

## Architecture Overview

### Component Hierarchy
```
FAQPage (Main Container)
├── BackgroundGradientAnimation (Fixed background)
├── MultiStepLoader (Initialization overlay)
├── PageTitle (Animated title)
├── ChatInputSection (Question input interface)
├── QuestionResponseSection (AI response display)
├── ChatHistory (Conversation history sidebar)
├── HelpScreen (Help modal)
├── AIInfoSection (AI system info modal)
└── PDF Viewer Dialog (Document viewer)
```

### State Management Pattern
The application uses custom React hooks for state management:

1. **useChatState** - Core chat functionality and UI states
2. **usePdfDialog** - PDF viewer state management
3. **useBackendApi** - API communication and response handling
4. **useChatHistory** - Conversation history persistence
5. **useTheme** - Theme switching and persistence

### Key Features

#### 1. AI-Powered Q&A System
- Users can ask questions in natural language
- AI backend processes questions against PDF knowledge base
- Responses are formatted with markdown support
- Real-time loading states and error handling

#### 2. Responsive UI with Animations
- Smooth transitions between question and response modes
- Animated background gradients that respond to theme changes
- Hover effects and micro-interactions on all interactive elements
- Mobile-responsive design

#### 3. PDF Document Viewer
- Integrated PDF viewer with fullscreen capability
- Reset and zoom controls
- Error handling for PDF loading failures
- Accessible via floating action button

#### 4. Theme System
- Dark/light mode toggle
- System preference detection
- Smooth theme transitions
- Background animation updates on theme change

#### 5. Chat History Management
- Persistent conversation history
- Expandable message view
- Clear history functionality
- Sidebar overlay interface

## File Structure

```
reliance-animated-faqu/
├── src/
│   ├── components/
│   │   ├── FAQPage.tsx (Main application component)
│   │   ├── PageTitle.tsx (Animated title component)
│   │   ├── ChatInputSection.tsx (Question input interface)
│   │   ├── QuestionResponseSection.tsx (AI response display)
│   │   ├── ChatHistory.tsx (Chat history sidebar)
│   │   ├── HelpScreen.tsx (Help modal)
│   │   ├── AIInfoSection.tsx (AI info modal)
│   │   └── ui/ (shadcn/ui components)
│   ├── hooks/
│   │   ├── useChatState.ts (Core chat state management)
│   │   ├── usePdfDialog.ts (PDF viewer state)
│   │   ├── useBackendApi.ts (API communication)
│   │   ├── useChatHistory.ts (History management)
│   │   └── useTheme.ts (Theme management)
│   ├── utils/
│   │   └── aiFormatter.ts (AI response formatting)
│   ├── data/
│   │   └── initializationSteps.ts (Loading screen steps)
│   └── config/
│       └── index.ts (Backend URL configuration)
```

## Component Responsibilities

### FAQPage.tsx (Main Component)
- **Purpose:** Root application component that orchestrates all functionality
- **State Management:** Integrates all custom hooks for comprehensive state management
- **Layout:** Manages fixed positioning of UI elements and responsive design
- **Event Handling:** Global click handlers and theme change listeners

### ChatInputSection.tsx
- **Purpose:** Handles user question input and submission
- **Features:** Auto-focus, loading states, input validation
- **Interactions:** Submit on Enter, responsive placeholder text

### QuestionResponseSection.tsx
- **Purpose:** Displays AI responses with formatting
- **Features:** Markdown rendering, loading animations, source attribution
- **Layout:** Responsive design with proper spacing and typography

### Custom Hooks Architecture

#### useChatState.ts
```typescript
// Manages core application state
{
  isInputFocused: boolean;
  showResponse: boolean;
  questionMode: boolean;
  currentQuestion: string;
  isReturnedFromResponse: boolean;
  isTransitioning: boolean;
  // Methods for state transitions
}
```

#### useBackendApi.ts
```typescript
// Handles all API communication
{
  loading: boolean;
  responseData: any;
  error: string | null;
  handleSubmitQuestion: (question: string, backendUrl: string) => Promise<void>;
}
```

## API Integration

### Backend Endpoints
- **POST /api/question** - Submit question and receive AI response
- **POST /api/refresh-pdfs** - Refresh PDF knowledge base
- **GET /pdf/reliance/reliance_faq.pdf** - Serve PDF document

### Request/Response Format
```typescript
// Question Request
{
  question: string;
}

// AI Response
{
  answer: string;
  sources?: string[];
  metadata?: any;
}
```

## Styling Guidelines

### Theme System
- **CSS Variables:** Uses CSS custom properties for theme values
- **Dark Mode:** Comprehensive dark mode support with smooth transitions
- **Color Palette:** Blue, purple, emerald accent colors with proper contrast ratios

### Animation Principles
- **Framer Motion:** Used for page transitions and component animations
- **Duration Standards:** 300ms for quick transitions, 700ms for theme changes
- **Easing:** Custom easing functions for smooth, natural motion

### Responsive Design
- **Breakpoints:** Mobile-first approach with tablet and desktop optimizations
- **Touch Targets:** Minimum 44px touch targets for mobile accessibility
- **Viewport Units:** Proper use of vh/vw for full-screen layouts

## Development Guidelines

### Code Organization
1. **Component Structure:** Single responsibility principle
2. **Hook Pattern:** Custom hooks for reusable stateful logic
3. **Type Safety:** Comprehensive TypeScript usage
4. **Error Handling:** Graceful error states and user feedback

### Performance Considerations
1. **Lazy Loading:** Components loaded on demand
2. **Memoization:** Prevent unnecessary re-renders
3. **Asset Optimization:** Efficient image and animation loading
4. **Bundle Splitting:** Code splitting for optimal loading

### Accessibility
1. **ARIA Labels:** Comprehensive labeling for screen readers
2. **Keyboard Navigation:** Full keyboard accessibility
3. **Focus Management:** Proper focus handling for modals and interactions
4. **Color Contrast:** WCAG compliant color combinations

## Common Development Tasks

### Adding New Features
1. Create custom hook for state management if needed
2. Build component with TypeScript interfaces
3. Integrate with existing animation system
4. Add proper error handling and loading states
5. Ensure responsive design and accessibility

### Modifying Animations
1. Use Framer Motion for complex animations
2. Follow existing duration and easing patterns
3. Test animations in both light and dark themes
4. Ensure animations don't interfere with accessibility

### API Integration
1. Use the useBackendApi hook pattern
2. Implement proper error handling
3. Add loading states for better UX
4. Type all API interfaces properly

## Known Issues and Considerations

### Current Limitations
1. Single PDF document support (designed for one knowledge base)
2. Theme change triggers page reload for background animation
3. Backend URL must be configured via TOML file

### Future Enhancement Areas
1. Multi-document support
2. Advanced search and filtering
3. User authentication and personalization
4. Offline capability with service workers

## Testing Approach

### Manual Testing Checklist
1. Question submission and response flow
2. Theme switching functionality
3. PDF viewer operations
4. Chat history management
5. Mobile responsiveness
6. Accessibility features

### Browser Compatibility
- **Modern Browsers:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile:** iOS Safari 14+, Chrome Mobile 90+
- **Features:** CSS Grid, Flexbox, CSS Custom Properties required

---

## For AI Assistants: Usage Instructions

When working with this codebase:

1. **Read this file first** to understand the project structure
2. **Focus on the specific component** the user mentions
3. **Follow established patterns** for new features
4. **Maintain TypeScript types** and proper error handling
5. **Test responsive design** and accessibility
6. **Ask for clarification** if requirements are unclear
7. **Suggest improvements** that align with the existing architecture

### Before Making Changes
1. Understand the component hierarchy and state flow
2. Check if custom hooks need updates
3. Consider animation and theme implications
4. Ensure changes don't break existing functionality
5. Follow the established code organization patterns

### When Adding Features
1. Use existing UI components from shadcn/ui
2. Create custom hooks for complex state logic
3. Implement proper loading and error states
4. Add appropriate animations and transitions
5. Ensure mobile responsiveness and accessibility

**Remember:** Always ask the user before updating this context file! 