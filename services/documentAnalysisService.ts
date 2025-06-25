import { Platform } from 'react-native';
import { supabaseClaudeAPI } from './supabaseClaudeAPI';
import { ConversationContext } from '../types/api';

export interface JobRequirement {
  skill: string;
  level: 'required' | 'preferred' | 'nice-to-have';
  category: 'technical' | 'soft' | 'experience' | 'education';
}

export interface CVExperience {
  skill: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category: 'technical' | 'soft' | 'experience' | 'education';
  evidence: string[];
}

export interface DocumentAnalysis {
  jobDescription: {
    requirements: JobRequirement[];
    responsibilities: string[];
    companyInfo: string;
    culture: string[];
    experienceLevel: 'junior' | 'mid' | 'senior' | 'executive';
    industry: string;
  };
  cv: {
    experiences: CVExperience[];
    achievements: string[];
    education: string[];
    totalExperience: number;
    keyStrengths: string[];
  };
  analysis: {
    matchScore: number;
    strengths: string[];
    gaps: string[];
    focusAreas: string[];
    difficulty: 'junior' | 'mid' | 'senior' | 'executive';
    recommendations: string[];
    interviewQuestions: {
      technical: string[];
      behavioral: string[];
      situational: string[];
      gapFocused: string[];
    };
  };
}

class DocumentAnalysisService {
  private cache = new Map<string, DocumentAnalysis>();

  async analyzeDocuments(
    jobDescription: string,
    cv: string = ''
  ): Promise<DocumentAnalysis> {
    // Create cache key
    const cacheKey = this.createCacheKey(jobDescription, cv);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const analysis = await this.performAnalysis(jobDescription, cv);
      
      // Cache the result
      this.cache.set(cacheKey, analysis);
      
      return analysis;
    } catch (error) {
      console.error('Document analysis failed:', error);
      throw new Error('Failed to analyze documents. Please try again.');
    }
  }

  private async performAnalysis(
    jobDescription: string,
    cv: string
  ): Promise<DocumentAnalysis> {
    const analysisPrompt = this.createAnalysisPrompt(jobDescription, cv);
    
    const context: ConversationContext = {
      messages: [],
      mode: 'document-analysis',
      sessionId: Date.now().toString(),
      metadata: {
        startTime: new Date(),
        lastActivity: new Date(),
        messageCount: 0,
        totalTokens: 0,
      },
    };

    const response = await supabaseClaudeAPI.sendMessage(analysisPrompt, context);
    
    if (response.error) {
      throw new Error(response.error);
    }

    if (!response.data) {
      throw new Error('No analysis data received');
    }

    return this.parseAnalysisResponse(response.data.content, jobDescription, cv);
  }

  private createAnalysisPrompt(jobDescription: string, cv: string): string {
    return `
You are an expert career coach and interview preparation specialist. Analyze the following job description and CV (if provided) to create a comprehensive interview preparation analysis.

JOB DESCRIPTION:
${jobDescription}

${cv ? `CV/RESUME:\n${cv}` : 'CV/RESUME: Not provided'}

Please provide a detailed analysis in the following format:

1. JOB ANALYSIS:
   - Extract key requirements (technical skills, experience level, responsibilities)
   - Identify company culture and values
   - Determine experience level (junior/mid/senior/executive)
   - Note industry and domain

2. CV ANALYSIS (if provided):
   - Identify relevant skills and experience
   - Note achievements and accomplishments
   - Assess overall experience level
   - Highlight key strengths

3. MATCH ANALYSIS:
   - Calculate match percentage (0-100%)
   - Identify strengths that align with job requirements
   - Identify gaps between requirements and CV
   - Suggest focus areas for interview preparation

4. INTERVIEW QUESTIONS:
   Generate 3-4 questions for each category:
   - Technical questions based on job requirements
   - Behavioral questions targeting CV experiences
   - Situational questions for job responsibilities
   - Gap-focused questions addressing missing skills

5. RECOMMENDATIONS:
   - Specific preparation advice
   - Areas to study or practice
   - How to address gaps during interview
   - Strategies to highlight strengths

Be specific, actionable, and constructive in your analysis. Focus on helping the candidate prepare effectively for the interview.
    `;
  }

  private parseAnalysisResponse(
    response: string,
    jobDescription: string,
    cv: string
  ): DocumentAnalysis {
    // This is a simplified parser. In a real implementation,
    // you might use more sophisticated NLP or structured prompts
    
    // For now, return a structured mock analysis based on the inputs
    const hasCV = cv.trim().length > 0;
    const jdLength = jobDescription.length;
    
    // Calculate basic match score
    let matchScore = 60; // Base score
    if (hasCV) {
      matchScore += 20; // Bonus for having CV
      if (cv.toLowerCase().includes('react') && jobDescription.toLowerCase().includes('react')) {
        matchScore += 10;
      }
      if (cv.toLowerCase().includes('javascript') && jobDescription.toLowerCase().includes('javascript')) {
        matchScore += 5;
      }
    }
    
    const analysis: DocumentAnalysis = {
      jobDescription: {
        requirements: this.extractRequirements(jobDescription),
        responsibilities: this.extractResponsibilities(jobDescription),
        companyInfo: this.extractCompanyInfo(jobDescription),
        culture: this.extractCulture(jobDescription),
        experienceLevel: this.determineExperienceLevel(jobDescription),
        industry: this.extractIndustry(jobDescription),
      },
      cv: {
        experiences: hasCV ? this.extractExperiences(cv) : [],
        achievements: hasCV ? this.extractAchievements(cv) : [],
        education: hasCV ? this.extractEducation(cv) : [],
        totalExperience: hasCV ? this.calculateTotalExperience(cv) : 0,
        keyStrengths: hasCV ? this.extractKeyStrengths(cv) : [],
      },
      analysis: {
        matchScore: Math.min(matchScore, 100),
        strengths: this.generateStrengths(jobDescription, cv, hasCV),
        gaps: this.generateGaps(jobDescription, cv, hasCV),
        focusAreas: this.generateFocusAreas(jobDescription, cv),
        difficulty: this.determineDifficulty(jobDescription),
        recommendations: this.generateRecommendations(jobDescription, cv, hasCV),
        interviewQuestions: this.generateInterviewQuestions(jobDescription, cv, hasCV),
      },
    };

    return analysis;
  }

  private extractRequirements(jobDescription: string): JobRequirement[] {
    const requirements: JobRequirement[] = [];
    const text = jobDescription.toLowerCase();
    
    // Common technical skills
    const technicalSkills = [
      'react', 'javascript', 'typescript', 'node.js', 'python', 'java',
      'react native', 'flutter', 'swift', 'kotlin', 'html', 'css',
      'sql', 'mongodb', 'postgresql', 'aws', 'docker', 'kubernetes'
    ];
    
    technicalSkills.forEach(skill => {
      if (text.includes(skill)) {
        requirements.push({
          skill: skill.charAt(0).toUpperCase() + skill.slice(1),
          level: text.includes('required') || text.includes('must have') ? 'required' : 'preferred',
          category: 'technical'
        });
      }
    });
    
    // Add some common soft skills
    if (text.includes('communication') || text.includes('collaborate')) {
      requirements.push({
        skill: 'Communication Skills',
        level: 'required',
        category: 'soft'
      });
    }
    
    if (text.includes('leadership') || text.includes('lead')) {
      requirements.push({
        skill: 'Leadership',
        level: 'preferred',
        category: 'soft'
      });
    }
    
    return requirements;
  }

  private extractResponsibilities(jobDescription: string): string[] {
    // Simple extraction - look for bullet points or numbered lists
    const lines = jobDescription.split('\n');
    const responsibilities: string[] = [];
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
        responsibilities.push(trimmed.substring(1).trim());
      } else if (/^\d+\./.test(trimmed)) {
        responsibilities.push(trimmed.replace(/^\d+\.\s*/, ''));
      }
    });
    
    // If no bullet points found, extract sentences that sound like responsibilities
    if (responsibilities.length === 0) {
      const sentences = jobDescription.split(/[.!?]+/);
      sentences.forEach(sentence => {
        const trimmed = sentence.trim();
        if (trimmed.includes('develop') || trimmed.includes('implement') || 
            trimmed.includes('manage') || trimmed.includes('create')) {
          responsibilities.push(trimmed);
        }
      });
    }
    
    return responsibilities.slice(0, 5); // Limit to 5 responsibilities
  }

  private extractCompanyInfo(jobDescription: string): string {
    // Extract company information from the job description
    const lines = jobDescription.split('\n');
    const companyLines = lines.filter(line => 
      line.toLowerCase().includes('company') || 
      line.toLowerCase().includes('about us') ||
      line.toLowerCase().includes('we are')
    );
    
    return companyLines.join(' ').substring(0, 200) || 'Company information not specified';
  }

  private extractCulture(jobDescription: string): string[] {
    const culture: string[] = [];
    const text = jobDescription.toLowerCase();
    
    const cultureKeywords = [
      'collaborative', 'innovative', 'fast-paced', 'startup', 'enterprise',
      'remote-friendly', 'flexible', 'diverse', 'inclusive', 'agile'
    ];
    
    cultureKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        culture.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
      }
    });
    
    return culture;
  }

  private determineExperienceLevel(jobDescription: string): 'junior' | 'mid' | 'senior' | 'executive' {
    const text = jobDescription.toLowerCase();
    
    if (text.includes('senior') || text.includes('lead') || text.includes('principal')) {
      return 'senior';
    } else if (text.includes('junior') || text.includes('entry') || text.includes('graduate')) {
      return 'junior';
    } else if (text.includes('director') || text.includes('vp') || text.includes('executive')) {
      return 'executive';
    } else {
      return 'mid';
    }
  }

  private extractIndustry(jobDescription: string): string {
    const text = jobDescription.toLowerCase();
    
    if (text.includes('fintech') || text.includes('finance')) return 'Finance';
    if (text.includes('healthcare') || text.includes('medical')) return 'Healthcare';
    if (text.includes('ecommerce') || text.includes('retail')) return 'E-commerce';
    if (text.includes('education') || text.includes('edtech')) return 'Education';
    if (text.includes('gaming') || text.includes('game')) return 'Gaming';
    
    return 'Technology';
  }

  private extractExperiences(cv: string): CVExperience[] {
    // Simple CV parsing - in a real implementation, this would be more sophisticated
    const experiences: CVExperience[] = [];
    const text = cv.toLowerCase();
    
    const skills = ['react', 'javascript', 'typescript', 'node.js', 'python'];
    
    skills.forEach(skill => {
      if (text.includes(skill)) {
        experiences.push({
          skill: skill.charAt(0).toUpperCase() + skill.slice(1),
          level: 'intermediate', // Default level
          category: 'technical',
          evidence: [`Experience with ${skill} mentioned in CV`]
        });
      }
    });
    
    return experiences;
  }

  private extractAchievements(cv: string): string[] {
    // Look for achievement indicators
    const achievements: string[] = [];
    const lines = cv.split('\n');
    
    lines.forEach(line => {
      const trimmed = line.trim().toLowerCase();
      if (trimmed.includes('increased') || trimmed.includes('improved') || 
          trimmed.includes('reduced') || trimmed.includes('achieved') ||
          trimmed.includes('led') || trimmed.includes('managed')) {
        achievements.push(line.trim());
      }
    });
    
    return achievements.slice(0, 5);
  }

  private extractEducation(cv: string): string[] {
    const education: string[] = [];
    const text = cv.toLowerCase();
    
    if (text.includes('bachelor') || text.includes('bs') || text.includes('ba')) {
      education.push('Bachelor\'s Degree');
    }
    if (text.includes('master') || text.includes('ms') || text.includes('ma')) {
      education.push('Master\'s Degree');
    }
    if (text.includes('phd') || text.includes('doctorate')) {
      education.push('PhD/Doctorate');
    }
    
    return education;
  }

  private calculateTotalExperience(cv: string): number {
    // Simple heuristic to estimate years of experience
    const text = cv.toLowerCase();
    const yearMatches = text.match(/(\d+)\s*years?/g);
    
    if (yearMatches) {
      const years = yearMatches.map(match => parseInt(match.match(/\d+/)![0]));
      return Math.max(...years);
    }
    
    return 2; // Default estimate
  }

  private extractKeyStrengths(cv: string): string[] {
    // Extract key strengths from CV
    return [
      'Technical problem solving',
      'Software development',
      'Team collaboration',
      'Project management'
    ];
  }

  private generateStrengths(jobDescription: string, cv: string, hasCV: boolean): string[] {
    const strengths: string[] = [];
    
    if (hasCV) {
      strengths.push('Relevant technical background');
      strengths.push('Demonstrated experience in software development');
      strengths.push('Strong foundation in programming concepts');
    } else {
      strengths.push('Clear understanding of job requirements');
      strengths.push('Opportunity to demonstrate learning potential');
    }
    
    return strengths;
  }

  private generateGaps(jobDescription: string, cv: string, hasCV: boolean): string[] {
    const gaps: string[] = [];
    
    if (!hasCV) {
      gaps.push('No CV provided for detailed skill assessment');
      gaps.push('Unable to verify specific technical experience');
    } else {
      // Analyze specific gaps based on job requirements vs CV
      if (jobDescription.toLowerCase().includes('react native') && 
          !cv.toLowerCase().includes('react native')) {
        gaps.push('No direct React Native experience mentioned');
      }
      
      if (jobDescription.toLowerCase().includes('typescript') && 
          !cv.toLowerCase().includes('typescript')) {
        gaps.push('TypeScript experience not clearly demonstrated');
      }
    }
    
    return gaps;
  }

  private generateFocusAreas(jobDescription: string, cv: string): string[] {
    return [
      'Technical problem-solving approach',
      'Communication and collaboration skills',
      'Learning and adaptation abilities',
      'Project experience and achievements'
    ];
  }

  private determineDifficulty(jobDescription: string): 'junior' | 'mid' | 'senior' | 'executive' {
    return this.determineExperienceLevel(jobDescription);
  }

  private generateRecommendations(jobDescription: string, cv: string, hasCV: boolean): string[] {
    const recommendations: string[] = [];
    
    if (!hasCV) {
      recommendations.push('Add your CV for personalized preparation advice');
      recommendations.push('Focus on demonstrating learning ability and potential');
    } else {
      recommendations.push('Prepare specific examples from your experience');
      recommendations.push('Practice explaining technical concepts clearly');
    }
    
    recommendations.push('Research the company culture and values');
    recommendations.push('Prepare thoughtful questions about the role');
    
    return recommendations;
  }

  private generateInterviewQuestions(
    jobDescription: string, 
    cv: string, 
    hasCV: boolean
  ): DocumentAnalysis['analysis']['interviewQuestions'] {
    return {
      technical: [
        'How would you approach building a scalable mobile application?',
        'Explain the difference between state and props in React.',
        'How do you handle API integration in mobile apps?',
        'What testing strategies do you use for mobile applications?'
      ],
      behavioral: hasCV ? [
        'Tell me about a challenging project you worked on.',
        'Describe a time when you had to learn a new technology quickly.',
        'How do you handle feedback and code reviews?',
        'Give an example of how you collaborated with a team.'
      ] : [
        'Why are you interested in this role?',
        'How do you approach learning new technologies?',
        'Describe your problem-solving process.',
        'What motivates you in software development?'
      ],
      situational: [
        'How would you handle a tight deadline with changing requirements?',
        'What would you do if you disagreed with a technical decision?',
        'How would you approach debugging a complex issue?',
        'How would you prioritize features in a product roadmap?'
      ],
      gapFocused: hasCV ? [
        'How would you transition your React experience to React Native?',
        'What steps would you take to learn TypeScript effectively?',
        'How do you stay updated with mobile development trends?',
        'What interests you about mobile development specifically?'
      ] : [
        'How do you plan to demonstrate your technical abilities?',
        'What resources do you use to learn new technologies?',
        'How would you contribute to our team without direct experience?',
        'What makes you confident you can succeed in this role?'
      ]
    };
  }

  private createCacheKey(jobDescription: string, cv: string): string {
    // Create a simple hash of the inputs for caching
    const combined = jobDescription + cv;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}

export const documentAnalysisService = new DocumentAnalysisService();