# MS-AQu: AI-Powered FAQ System

An intelligent FAQ system that combines a Flask backend with a modern React frontend to provide AI-powered document question-answering capabilities.

## 🚀 Features

- **AI-Powered Q&A**: Upload PDF documents and get intelligent answers to your questions
- **Modern UI**: Clean, responsive React frontend with dark/light theme support
- **Real-time Chat**: Interactive chat interface for seamless user experience
- **Document Processing**: Advanced PDF parsing and text extraction
- **Search & Navigation**: Smart document navigation and content routing
- **Multi-format Support**: Support for various document formats
- **Animation Effects**: Beautiful UI animations and loading states

## 📁 Project Structure

```
faqu-reliance/
├── AQu/                          # Flask Backend
│   ├── app.py                    # Main Flask application
│   ├── new_search.py            # AI search and processing logic
│   ├── requirements.txt         # Python dependencies
│   ├── templates/               # HTML templates
│   └── pdf/                     # PDF document storage
├── merchandising-module-site/   # React Frontend (Main)
└── reliance-animated-faqu/     # React Frontend (Alternative)
```

## 🛠️ Backend Setup (Flask)

### Prerequisites
- Python 3.8+
- OpenAI API key

### Installation

1. Navigate to the backend directory:
```bash
cd AQu
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
# Create .env file
echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
```

4. Run the Flask application:
```bash
python app.py
```

The backend will be available at `http://localhost:5000`

### Backend Features
- **Document Loading**: Automatic PDF processing and text extraction
- **AI Integration**: OpenAI-powered question answering
- **CORS Support**: Cross-origin requests enabled for frontend integration
- **Chunking System**: Intelligent text splitting for better processing
- **Progress Tracking**: Real-time loading progress for document processing

## 🎨 Frontend Setup (React)

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Navigate to the frontend directory:
```bash
cd merchandising-module-site
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Frontend Features
- **Modern UI Components**: Built with Radix UI and Tailwind CSS
- **Theme Support**: Dark/light mode toggle
- **Responsive Design**: Mobile-first responsive layout
- **Interactive Chat**: Real-time chat interface with typing indicators
- **Loading Animations**: Beautiful loading states and transitions
- **FAQ Navigation**: Structured FAQ display and navigation

## 🔧 Available Scripts

### Backend (Flask)
```bash
python app.py          # Start the Flask server
```

### Frontend (React)
```bash
npm run dev           # Start development server
npm run build         # Build for production
npm run preview       # Preview production build
npm run lint          # Run ESLint
```

## 📋 API Endpoints

### Backend API
- `GET /` - Main application interface
- `POST /search` - Submit questions and get AI-powered answers
- `GET /pdf/<filename>` - Serve PDF files
- `GET /available_pdfs` - Get list of available PDF documents
- `POST /load_document` - Load and process a new document

## 🔑 Environment Variables

### Backend (.env)
```
OPENAI_API_KEY=your_openai_api_key_here
```

## 📦 Dependencies

### Backend (Python)
- Flask - Web framework
- OpenAI - AI integration
- pypdf - PDF processing
- python-dotenv - Environment variable management

### Frontend (React)
- React 18 - UI framework
- TypeScript - Type safety
- Tailwind CSS - Styling
- Radix UI - Component library
- Vite - Build tool
- React Router - Navigation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🎯 Usage

1. **Start the Backend**: Run the Flask server to handle AI processing
2. **Start the Frontend**: Launch the React application for user interface
3. **Upload Documents**: Place PDF files in the `AQu/pdf/` directory
4. **Ask Questions**: Use the chat interface to ask questions about your documents
5. **Get AI Answers**: Receive intelligent, context-aware responses

## 🔮 Future Enhancements

- Multi-language support
- Advanced document formats (Word, Excel, etc.)
- User authentication and document management
- Enhanced AI models and processing
- Real-time collaboration features
- Document versioning and history

---

**Built with ❤️ using Flask, React, and OpenAI**