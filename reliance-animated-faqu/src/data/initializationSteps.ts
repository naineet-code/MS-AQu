export const funnyInitSteps = [
  [
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
    { text: "Ready to answer questions you didn't know you had!" }
  ],
  [
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
    { text: "Ready to make documentation actually useful!" }
  ],
  [
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
    { text: "Ready to turn confusion into clarity!" }
  ],
  [
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
    { text: "Ready to make support tickets a thing of the past!" }
  ],
  [
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
    { text: "Ready to be your friendly neighborhood know-it-all!" }
  ]
];

export const getRandomInitSteps = () => {
  return funnyInitSteps[Math.floor(Math.random() * funnyInitSteps.length)];
}; 