import { ConversationMode } from '../types';

export const conversationModes: ConversationMode[] = [
  {
    id: 'general-chat',
    name: 'General Chat',
    description: 'Natural conversations on any topic with social skill development',
    icon: 'message-circle',
    systemPrompt: 'You are a friendly and empathetic conversation partner. Focus on developing the user\'s social skills, active listening, and empathy. Engage in natural, flowing conversations while gently guiding them to practice social interaction skills.',
    category: 'social',
    difficulty: 'beginner',
    estimatedDuration: 15,
    color: {
      primary: '#3B82F6',
      secondary: '#1D4ED8',
      gradient: ['#3B82F6', '#1E40AF']
    },
    features: ['Social Skills', 'Active Listening', 'Empathy Building'],
    topics: ['Daily Life', 'Hobbies', 'Current Events', 'Personal Growth', 'Relationships'],
    aiPersonalities: ['Supportive', 'Curious', 'Encouraging'],
    sessionTypes: {
      quick: { duration: 5, description: 'Quick chat' },
      standard: { duration: 15, description: 'Regular conversation' },
      extended: { duration: 60, description: 'Deep discussion' }
    }
  },
  {
    id: 'debate-challenge',
    name: 'Debate Challenge',
    description: 'Structured argumentative discussions with logic training',
    icon: 'users',
    systemPrompt: 'You are a skilled debate moderator and opponent. Help the user practice critical thinking, logical argumentation, and respectful disagreement. Present well-reasoned counterarguments while maintaining a respectful tone.',
    category: 'critical-thinking',
    difficulty: 'intermediate',
    estimatedDuration: 30,
    color: {
      primary: '#EF4444',
      secondary: '#DC2626',
      gradient: ['#EF4444', '#B91C1C']
    },
    features: ['Critical Thinking', 'Logical Arguments', 'Respectful Disagreement'],
    topics: ['Technology Ethics', 'Environmental Policy', 'Social Issues', 'Education', 'Healthcare'],
    aiPersonalities: ['Challenging', 'Analytical', 'Fair'],
    sessionTypes: {
      quick: { duration: 15, description: 'Quick debate round' },
      standard: { duration: 30, description: 'Full debate session' },
      extended: { duration: 45, description: 'Tournament style' }
    }
  },
  {
    id: 'idea-brainstorm',
    name: 'Idea Brainstorm',
    description: 'Creative thinking sessions with innovation coaching',
    icon: 'lightbulb',
    systemPrompt: 'You are an innovative thinking coach and creative catalyst. Help the user generate ideas, think outside the box, and develop creative solutions. Encourage wild ideas and build upon their creativity.',
    category: 'creativity',
    difficulty: 'beginner',
    estimatedDuration: 20,
    color: {
      primary: '#10B981',
      secondary: '#059669',
      gradient: ['#10B981', '#047857']
    },
    features: ['Creative Thinking', 'Innovation', 'Problem Solving'],
    topics: ['Product Ideas', 'Business Solutions', 'Art Projects', 'Life Improvements', 'Technology'],
    aiPersonalities: ['Inspiring', 'Energetic', 'Open-minded'],
    sessionTypes: {
      quick: { duration: 10, description: 'Rapid ideation' },
      standard: { duration: 20, description: 'Creative session' },
      extended: { duration: 30, description: 'Deep dive brainstorm' }
    }
  },
  {
    id: 'interview-practice',
    name: 'Interview Practice',
    description: 'Professional preparation with job-specific scenarios',
    icon: 'briefcase',
    systemPrompt: 'You are an experienced hiring manager conducting a professional interview. Ask relevant questions based on the job level and industry, provide constructive feedback, and help build the user\'s confidence.',
    category: 'professional',
    difficulty: 'intermediate',
    estimatedDuration: 45,
    color: {
      primary: '#8B5CF6',
      secondary: '#7C3AED',
      gradient: ['#8B5CF6', '#6D28D9']
    },
    features: ['Professional Communication', 'Confidence Building', 'Industry Knowledge'],
    topics: ['Behavioral Questions', 'Technical Skills', 'Career Goals', 'Problem Solving', 'Leadership'],
    aiPersonalities: ['Professional', 'Encouraging', 'Thorough'],
    sessionTypes: {
      quick: { duration: 20, description: 'Quick screening' },
      standard: { duration: 45, description: 'Full interview' },
      extended: { duration: 60, description: 'Panel interview' }
    }
  },
  {
    id: 'presentation-prep',
    name: 'Presentation Prep',
    description: 'Public speaking practice with engagement coaching',
    icon: 'presentation',
    systemPrompt: 'You are a public speaking coach and presentation expert. Help the user practice their presentation skills, improve their delivery, and engage their audience effectively.',
    category: 'presentation',
    difficulty: 'intermediate',
    estimatedDuration: 25,
    color: {
      primary: '#F59E0B',
      secondary: '#D97706',
      gradient: ['#F59E0B', '#B45309']
    },
    features: ['Public Speaking', 'Audience Engagement', 'Clear Structure'],
    topics: ['Business Presentations', 'Academic Talks', 'Sales Pitches', 'Training Sessions', 'Conferences'],
    aiPersonalities: ['Constructive', 'Detailed', 'Motivating'],
    sessionTypes: {
      quick: { duration: 5, description: 'Elevator pitch' },
      standard: { duration: 25, description: 'Full presentation' },
      extended: { duration: 45, description: 'Workshop style' }
    }
  },
  {
    id: 'language-learning',
    name: 'Language Learning',
    description: 'Conversation practice with cultural context',
    icon: 'globe',
    systemPrompt: 'You are a patient and encouraging language tutor. Help the user practice their target language, correct mistakes gently, and provide cultural context to enhance their learning.',
    category: 'education',
    difficulty: 'beginner',
    estimatedDuration: 20,
    color: {
      primary: '#06B6D4',
      secondary: '#0891B2',
      gradient: ['#06B6D4', '#0E7490']
    },
    features: ['Vocabulary Building', 'Pronunciation', 'Cultural Context'],
    topics: ['Daily Conversations', 'Travel Scenarios', 'Business Language', 'Cultural Exchange', 'Grammar Practice'],
    aiPersonalities: ['Patient', 'Encouraging', 'Cultural'],
    sessionTypes: {
      quick: { duration: 10, description: 'Quick practice' },
      standard: { duration: 20, description: 'Conversation practice' },
      extended: { duration: 40, description: 'Immersive session' }
    }
  }
];

export const getModeById = (id: string): ConversationMode | undefined => {
  return conversationModes.find(mode => mode.id === id);
};

export const getModesByCategory = (category: string): ConversationMode[] => {
  return conversationModes.filter(mode => mode.category === category);
};

export const getModesByDifficulty = (difficulty: string): ConversationMode[] => {
  return conversationModes.filter(mode => mode.difficulty === difficulty);
};