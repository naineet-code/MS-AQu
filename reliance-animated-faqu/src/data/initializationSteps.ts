// All initialization messages for random selection
export const allInitSteps = [
  // Set 1: Teaching AI basic help desk concepts
  { text: "Teaching AI that RTFM doesn't mean 'Read The Fun Manual'..." },
  { text: "Loading the 'Obvious Questions People Ask' database..." },
  { text: "Calibrating patience levels for repetitive questions..." },
  { text: "Installing empathy modules for confused users..." },
  { text: "Debugging why people don't scroll down..." },
  { text: "Optimizing responses for maximum clarity..." },
  { text: "Teaching search engines to find the right answer..." },
  { text: "Installing the 'Don't Make Me Think' protocol..." },
  { text: "Loading responses that actually solve problems..." },
  { text: "Preparing for users who skim instead of read..." },
  { text: "Buffering solutions to problems you didn't know existed..." },
  { text: "Finalizing the knowledge base optimization..." },

  // Set 2: AI patience and understanding
  { text: "Convincing AI that 'Have you tried turning it off and on?' isn't always the answer..." },
  { text: "Loading infinite patience for the same question asked 50 times..." },
  { text: "Teaching algorithms the art of helpful responses..." },
  { text: "Installing common sense plugins..." },
  { text: "Preparing for questions about questions..." },
  { text: "Buffering wisdom from the knowledge vault..." },
  { text: "Teaching AI the difference between urgent and important..." },
  { text: "Loading the 'Actually Listen to What They're Asking' module..." },
  { text: "Installing the 'Context Matters' understanding engine..." },
  { text: "Preparing responses that won't create more questions..." },
  { text: "Teaching machines to read between the lines..." },
  { text: "Optimizing for humans who hate reading manuals..." },

  // Set 3: Clear communication
  { text: "Explaining to AI why 'It depends' isn't a helpful answer..." },
  { text: "Loading FAQ answers that people will still ask about..." },
  { text: "Teaching machine learning that humans don't read instructions..." },
  { text: "Calibrating response clarity to maximum..." },
  { text: "Installing 'Actually Helpful' response engine..." },
  { text: "Preparing answers for questions not yet asked..." },
  { text: "Teaching AI to speak human instead of robot..." },
  { text: "Loading the 'Skip the Jargon' translator..." },
  { text: "Installing emotional intelligence for better support..." },
  { text: "Preparing for users who just want it to work..." },
  { text: "Teaching algorithms to predict what you really meant..." },
  { text: "Optimizing for clarity over technical accuracy..." },

  // Set 4: Documentation and user behavior
  { text: "Initializing the 'Why Didn't You Google This First?' module..." },
  { text: "Loading documentation that people might actually read..." },
  { text: "Installing the 'Skip to the Good Stuff' filter..." },
  { text: "Teaching AI to translate technical jargon to human..." },
  { text: "Preparing for the age-old question: 'Did you check the FAQ?'..." },
  { text: "Buffering helpful answers and hiding the sarcastic ones..." },
  { text: "Loading the 'Assume They Haven't Read Anything' protocol..." },
  { text: "Installing patience for explaining the same thing differently..." },
  { text: "Teaching AI that 'user error' isn't always the answer..." },
  { text: "Preparing responses for people who hate documentation..." },
  { text: "Loading solutions that work on the first try..." },
  { text: "Teaching machines the art of gentle guidance..." },

  // Set 5: Practical support wisdom
  { text: "Uploading the 'Common Sense Isn't So Common' database..." },
  { text: "Loading wisdom from every help desk ticket ever filed..." },
  { text: "Installing the 'Actually Read the Error Message' reminder..." },
  { text: "Teaching AI that 'It's not working' isn't a detailed bug report..." },
  { text: "Preparing answers for questions you'll ask tomorrow..." },
  { text: "Optimizing for clarity because nobody likes confusing docs..." },
  { text: "Loading the 'Explain Like I'm Five' communication style..." },
  { text: "Installing the 'Show, Don't Just Tell' methodology..." },
  { text: "Teaching AI to give examples with every explanation..." },
  { text: "Preparing for users who learn by doing, not reading..." },
  { text: "Loading solutions that prevent future problems..." },
  { text: "Teaching machines to anticipate follow-up questions..." },

  // Set 6: New humor and tech wit
  { text: "Convincing machines that 'magic' isn't a valid error code..." },
  { text: "Teaching AI that users click 'Yes' without reading..." },
  { text: "Loading the 'Works on My Machine' translator..." },
  { text: "Installing the universal 'Please Wait' patience generator..." },
  { text: "Teaching systems that silence doesn't mean consent..." },
  { text: "Preparing for the eternal 'Is it plugged in?' questions..." },
  { text: "Loading responses for when users say 'It's broken'..." },
  { text: "Installing the 'Define Broken' clarification protocol..." },
  { text: "Teaching AI that screenshots of error messages help..." },
  { text: "Buffering solutions for problems that solve themselves..." },
  { text: "Preparing for users who restart everything except the problem..." },
  { text: "Loading the 'Did You Save Your Work?' reminder system..." }
];

// Advanced randomization function that ensures variety across sessions
export const getRandomInitSteps = (count: number = 4) => {
  // Always start with this specific AQu message
  const aquMessage = { text: "Connecting to AQu Intelligence network..." };
  
  // Advanced shuffle algorithm for better randomization
  const shuffledMessages = [...allInitSteps];
  
  // Fisher-Yates shuffle for true randomization
  for (let i = shuffledMessages.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledMessages[i], shuffledMessages[j]] = [shuffledMessages[j], shuffledMessages[i]];
  }
  
  // Select random messages ensuring no duplicates
  const selectedMessages = [];
  const usedIndices = new Set();
  
  while (selectedMessages.length < (count - 1) && selectedMessages.length < allInitSteps.length) {
    const randomIndex = Math.floor(Math.random() * shuffledMessages.length);
    if (!usedIndices.has(randomIndex)) {
      usedIndices.add(randomIndex);
      selectedMessages.push(shuffledMessages[randomIndex]);
    }
  }
  
  // Combine AQu step first, then randomly selected steps
  return [aquMessage, ...selectedMessages];
};

// Function to get all messages for preview/testing
export const getAllInitSteps = () => allInitSteps; 