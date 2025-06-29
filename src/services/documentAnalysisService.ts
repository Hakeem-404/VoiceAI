import { Platform } from 'react-native';
import { supabaseClaudeAPI } from './supabaseClaudeAPI';
import { ConversationContext } from '../../types/api';
import { DocumentAnalysis } from '../types';

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
      // Use Claude API for intelligent analysis
      const analysis = await this.performClaudeAnalysis(jobDescription, cv);
      
      // Cache the result
      this.cache.set(cacheKey, analysis);
      
      return analysis;
    } catch (error) {
      console.error('Document analysis failed:', error);
      throw new Error('Failed to analyze documents. Please try again.');
    }
  }

  private async performClaudeAnalysis(
    jobDescription: string,
    cv: string
  ): Promise<DocumentAnalysis> { 
    console.log('Performing Claude analysis of documents');
    
    // Step 1: Analyze job description
    const jdAnalysis = await this.analyzeJobDescription(jobDescription);
    console.log('Job description analysis complete');
    
    // Step 2: Analyze CV if provided
    const cvAnalysis = cv ? await this.analyzeCV(cv) : this.getEmptyCVAnalysis();
    console.log('CV analysis complete');
    
    // Step 3: Compare JD and CV for match analysis
    const matchAnalysis = await this.compareJDandCV(jdAnalysis, cvAnalysis, jobDescription, cv);
    console.log('Match analysis complete');
    
    // Combine all analyses into final result
    return {
      jobDescription: jdAnalysis,
      cv: cvAnalysis,
      analysis: matchAnalysis
    };
  }

  private async analyzeJobDescription(jobDescription: string): Promise<DocumentAnalysis['jobDescription']> {
    const prompt = `You are a job analysis expert. Analyze this job description and extract key information.

JOB DESCRIPTION:
${jobDescription.substring(0, 5000)} ${jobDescription.length > 5000 ? '... (truncated)' : ''}

IMPORTANT: You must respond with ONLY a valid JSON object in exactly this format:
{
  "requirements": ["requirement 1", "requirement 2"],
  "skills": ["skill 1", "skill 2"],
  "experience": "junior/mid/senior/executive level description",
  "responsibilities": ["responsibility 1", "responsibility 2"],
  "companyInfo": "company information summary",
  "culture": ["culture value 1", "culture value 2"]
}

Extract 5-7 key requirements, 5-7 technical and soft skills, 3-5 main responsibilities, and 2-3 company culture values.
Respond ONLY with the JSON object, no other text.`;

    try {
      const response = await this.sendMessageToClaude(prompt, 'jd_analysis');
      return this.parseJobDescriptionResponse(response);
    } catch (error) { 
      console.error('Job description analysis failed:', error);
      // Return fallback analysis
      return this.getFallbackJobAnalysis(jobDescription);
    }
  }

  private async analyzeCV(cv: string): Promise<DocumentAnalysis['cv']> {
    const prompt = `You are a CV analysis expert. Analyze this CV/Resume and extract key information.

CV/RESUME:
${cv.substring(0, 5000)} ${cv.length > 5000 ? '... (truncated)' : ''}

IMPORTANT: You must respond with ONLY a valid JSON object in exactly this format:
{
  "skills": ["skill 1", "skill 2"],
  "experience": ["experience 1", "experience 2"],
  "achievements": ["achievement 1", "achievement 2"],
  "education": ["education 1", "education 2"],
  "technologies": ["technology 1", "technology 2"]
}

Extract 5-7 key skills, 3-5 relevant experiences, 2-3 notable achievements, education details, and 5-7 technologies/tools.
Respond ONLY with the JSON object, no other text.`;

    try {
      const response = await this.sendMessageToClaude(prompt, 'cv_analysis');
      return this.parseCVResponse(response);
    } catch (error) {
      console.error('CV analysis failed:', error);
      // Return fallback analysis
      return this.getFallbackCVAnalysis(cv);
    }
  }

  private async compareJDandCV(
    jdAnalysis: DocumentAnalysis['jobDescription'],
    cvAnalysis: DocumentAnalysis['cv'],
    jobDescription: string,
    cv: string
  ): Promise<DocumentAnalysis['analysis']> {
    const prompt = `You are an interview preparation expert. Compare this job description with the candidate profile and provide match assessment. 

JOB DESCRIPTION:
${jobDescription.substring(0, 3000)} ${jobDescription.length > 3000 ? '... (truncated)' : ''}

JOB REQUIREMENTS:
${JSON.stringify(jdAnalysis, null, 2)}

${cv ? `CV/RESUME:
${cv.substring(0, 3000)} ${cv.length > 3000 ? '... (truncated)' : ''}

CANDIDATE PROFILE:
${JSON.stringify(cvAnalysis, null, 2)}` : 'CV/RESUME: Not provided'}

IMPORTANT: You must respond with ONLY a valid JSON object in exactly this format:
{
  "matchScore": 75,
  "strengths": ["strength 1", "strength 2"],
  "gaps": ["gap 1", "gap 2"],
  "focusAreas": ["focus area 1", "focus area 2"],
  "difficulty": "junior",
  "recommendations": ["recommendation 1", "recommendation 2"],
  "interviewQuestions": {
    "technical": ["question 1", "question 2"],
    "behavioral": ["question 1", "question 2"],
    "situational": ["question 1", "question 2"],
    "gapFocused": ["question 1", "question 2"]
  }
}

The matchScore should be 0-100. Difficulty should be one of: "junior", "mid", "senior", "executive".
Generate 4-5 interview questions for each category.
Respond ONLY with the JSON object, no other text.`;

    try {
      const response = await this.sendMessageToClaude(prompt, 'match_analysis');
      return this.parseMatchResponse(response);
    } catch (error) {
      console.error('Match analysis failed:', error);
      // Return fallback analysis
      return this.getFallbackMatchAnalysis(jdAnalysis, cvAnalysis);
    }
  }

  // Improved message sending with better error handling
  private async sendMessageToClaude(prompt: string, analysisType: string): Promise<string> {
    const context: ConversationContext = {
      messages: [], 
      mode: 'document-analysis',
      sessionId: `${analysisType}_${Date.now()}`,
      metadata: {
        startTime: new Date(),
        lastActivity: new Date(),
        messageCount: 0,
        totalTokens: 0,
      },
    };
    
    console.log(`Sending ${analysisType} to Claude:`, {
      mode: context.mode,
      message_length: prompt.length,
      total_messages: context.messages.length + 1,
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 1000 // Increased for JSON responses
    });
    
    // Pass explicit options to override the default max_tokens
    const apiOptions = {
      timeout: 45000,
      retries: 2,
      cache: false,
      maxTokens: 2000 // This should override the mode-specific token limit
    };
    
    const response = await supabaseClaudeAPI.sendMessage(prompt, context, apiOptions);
    
    if (response.error) {
      console.error(`${analysisType} failed:`, response.error);
      throw new Error(`Failed to analyze: ${response.error}`);
    }
    
    if (!response.data) {
      throw new Error(`No analysis data received for ${analysisType}`);
    }
    
    console.log(`Received ${analysisType} response:`, {
      response_length: response.data.content.length
    });
    
    return response.data.content;
  }

  // Improved JSON parsing with multiple fallback strategies
  private parseJobDescriptionResponse(responseContent: string): DocumentAnalysis['jobDescription'] {
    try {
      // Strategy 1: Look for JSON object
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        let jsonString = jsonMatch[0];
        
        // Strategy 1a: Try to fix truncated JSON by closing incomplete objects/arrays
        if (!this.isValidJSON(jsonString)) {
          jsonString = this.attemptJSONRepair(jsonString);
        }
        
        const parsedData = JSON.parse(jsonString);
        return {
          requirements: Array.isArray(parsedData.requirements) ? parsedData.requirements : [],
          skills: Array.isArray(parsedData.skills) ? parsedData.skills : [],
          experience: typeof parsedData.experience === 'string' ? parsedData.experience : 'mid',
          responsibilities: Array.isArray(parsedData.responsibilities) ? parsedData.responsibilities : [],
          companyInfo: typeof parsedData.companyInfo === 'string' ? parsedData.companyInfo : '',
          culture: Array.isArray(parsedData.culture) ? parsedData.culture : [],
        };
      }
      
      // Strategy 2: Try parsing the entire response as JSON
      let jsonString = responseContent.trim();
      if (!this.isValidJSON(jsonString)) {
        jsonString = this.attemptJSONRepair(jsonString);
      }
      
      const parsedData = JSON.parse(jsonString);
      return {
        requirements: Array.isArray(parsedData.requirements) ? parsedData.requirements : [],
        skills: Array.isArray(parsedData.skills) ? parsedData.skills : [],
        experience: typeof parsedData.experience === 'string' ? parsedData.experience : 'mid',
        responsibilities: Array.isArray(parsedData.responsibilities) ? parsedData.responsibilities : [],
        companyInfo: typeof parsedData.companyInfo === 'string' ? parsedData.companyInfo : '',
        culture: Array.isArray(parsedData.culture) ? parsedData.culture : [],
      };
    } catch (error) {
      console.error('Failed to parse job description analysis:', error);
      console.log('Raw response:', responseContent);
      console.log('Falling back to manual extraction...');
      
      // Strategy 3: Manual extraction from partial JSON
      return this.extractJobDescriptionFromText(responseContent);
    }
  }

  private parseCVResponse(responseContent: string): DocumentAnalysis['cv'] {
    try {
      // Strategy 1: Look for JSON object
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        let jsonString = jsonMatch[0];
        
        // Strategy 1a: Try to fix truncated JSON
        if (!this.isValidJSON(jsonString)) {
          jsonString = this.attemptJSONRepair(jsonString);
        }
        
        const parsedData = JSON.parse(jsonString);
        return {
          skills: Array.isArray(parsedData.skills) ? parsedData.skills : [],
          experience: Array.isArray(parsedData.experience) ? parsedData.experience : [],
          achievements: Array.isArray(parsedData.achievements) ? parsedData.achievements : [],
          education: Array.isArray(parsedData.education) ? parsedData.education : [],
          technologies: Array.isArray(parsedData.technologies) ? parsedData.technologies : [],
        };
      }
      
      // Strategy 2: Try parsing the entire response as JSON
      let jsonString = responseContent.trim();
      if (!this.isValidJSON(jsonString)) {
        jsonString = this.attemptJSONRepair(jsonString);
      }
      
      const parsedData = JSON.parse(jsonString);
      return {
        skills: Array.isArray(parsedData.skills) ? parsedData.skills : [],
        experience: Array.isArray(parsedData.experience) ? parsedData.experience : [],
        achievements: Array.isArray(parsedData.achievements) ? parsedData.achievements : [],
        education: Array.isArray(parsedData.education) ? parsedData.education : [],
        technologies: Array.isArray(parsedData.technologies) ? parsedData.technologies : [],
      };
    } catch (error) {
      console.error('Failed to parse CV analysis:', error);
      console.log('Raw response:', responseContent);
      console.log('Falling back to manual extraction...');
      
      // Strategy 3: Manual extraction from partial JSON
      return this.extractCVFromText(responseContent);
    }
  }

  private parseMatchResponse(responseContent: string): DocumentAnalysis['analysis'] {
    try {
      // Strategy 1: Look for JSON object
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        let jsonString = jsonMatch[0];
        
        // Strategy 1a: Try to fix truncated JSON
        if (!this.isValidJSON(jsonString)) {
          jsonString = this.attemptJSONRepair(jsonString);
        }
        
        const parsedData = JSON.parse(jsonString);
        return {
          matchScore: typeof parsedData.matchScore === 'number' ? parsedData.matchScore : 60,
          strengths: Array.isArray(parsedData.strengths) ? parsedData.strengths : [],
          gaps: Array.isArray(parsedData.gaps) ? parsedData.gaps : [],
          focusAreas: Array.isArray(parsedData.focusAreas) ? parsedData.focusAreas : [],
          difficulty: ['junior', 'mid', 'senior', 'executive'].includes(parsedData.difficulty) ? parsedData.difficulty : 'mid',
          recommendations: Array.isArray(parsedData.recommendations) ? parsedData.recommendations : [],
          interviewQuestions: {
            technical: Array.isArray(parsedData.interviewQuestions?.technical) ? parsedData.interviewQuestions.technical : [],
            behavioral: Array.isArray(parsedData.interviewQuestions?.behavioral) ? parsedData.interviewQuestions.behavioral : [],
            situational: Array.isArray(parsedData.interviewQuestions?.situational) ? parsedData.interviewQuestions.situational : [],
            gapFocused: Array.isArray(parsedData.interviewQuestions?.gapFocused) ? parsedData.interviewQuestions.gapFocused : [],
          },
        };
      }
      
      // Strategy 2: Try parsing the entire response as JSON
      let jsonString = responseContent.trim();
      if (!this.isValidJSON(jsonString)) {
        jsonString = this.attemptJSONRepair(jsonString);
      }
      
      const parsedData = JSON.parse(jsonString);
      return {
        matchScore: typeof parsedData.matchScore === 'number' ? parsedData.matchScore : 60,
        strengths: Array.isArray(parsedData.strengths) ? parsedData.strengths : [],
        gaps: Array.isArray(parsedData.gaps) ? parsedData.gaps : [],
        focusAreas: Array.isArray(parsedData.focusAreas) ? parsedData.focusAreas : [],
        difficulty: ['junior', 'mid', 'senior', 'executive'].includes(parsedData.difficulty) ? parsedData.difficulty : 'mid',
        recommendations: Array.isArray(parsedData.recommendations) ? parsedData.recommendations : [],
        interviewQuestions: {
          technical: Array.isArray(parsedData.interviewQuestions?.technical) ? parsedData.interviewQuestions.technical : [],
          behavioral: Array.isArray(parsedData.interviewQuestions?.behavioral) ? parsedData.interviewQuestions.behavioral : [],
          situational: Array.isArray(parsedData.interviewQuestions?.situational) ? parsedData.interviewQuestions.situational : [],
          gapFocused: Array.isArray(parsedData.interviewQuestions?.gapFocused) ? parsedData.interviewQuestions.gapFocused : [],
        },
      };
    } catch (error) {
      console.error('Failed to parse match analysis:', error);
      console.log('Raw response:', responseContent);
      console.log('Falling back to manual extraction...');
      
      // Strategy 3: Manual extraction from partial JSON
      return this.extractMatchFromText(responseContent);
    }
  }

  // Helper methods for JSON repair and text extraction
  private isValidJSON(str: string): boolean {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }

  private attemptJSONRepair(jsonString: string): string {
    let repaired = jsonString;
    
    // Count open and close braces
    const openBraces = (repaired.match(/\{/g) || []).length;
    const closeBraces = (repaired.match(/\}/g) || []).length;
    
    // Count open and close brackets
    const openBrackets = (repaired.match(/\[/g) || []).length;
    const closeBrackets = (repaired.match(/\]/g) || []).length;
    
    // Add missing closing brackets
    for (let i = 0; i < openBrackets - closeBrackets; i++) {
      repaired += ']';
    }
    
    // Add missing closing braces
    for (let i = 0; i < openBraces - closeBraces; i++) {
      repaired += '}';
    }
    
    // Remove incomplete trailing strings/fields
    repaired = repaired.replace(/,\s*$/, ''); // Remove trailing comma
    repaired = repaired.replace(/,\s*[\]\}]+$/, (match) => match.replace(',', '')); // Remove comma before closing
    
    return repaired;
  }

  private extractJobDescriptionFromText(text: string): DocumentAnalysis['jobDescription'] {
    // Extract arrays from partial JSON text
    const requirements = this.extractArrayFromText(text, 'requirements') || [];
    const skills = this.extractArrayFromText(text, 'skills') || []; 
    const responsibilities = this.extractArrayFromText(text, 'responsibilities') || [];
    const culture = this.extractArrayFromText(text, 'culture') || [];
    
    // Extract experience level
    const experienceMatch = text.match(/"experience":\s*"([^"]*)/);
    const experience = experienceMatch ? experienceMatch[1] : 'mid';

    // Extract company info
    const companyInfoMatch = text.match(/"companyInfo":\s*"([^"]*)/);
    const companyInfo = companyInfoMatch ? companyInfoMatch[1] : '';
    
    return {
      requirements,
      skills,
      experience,
      responsibilities,
      companyInfo,
      culture
    };
  }

  private extractCVFromText(text: string): DocumentAnalysis['cv'] {
    return { 
      skills: this.extractArrayFromText(text, 'skills') || [],
      experience: this.extractArrayFromText(text, 'experience') || [],
      achievements: this.extractArrayFromText(text, 'achievements') || [],
      education: this.extractArrayFromText(text, 'education') || [],
      technologies: this.extractArrayFromText(text, 'technologies') || [],
    };
  }

  private extractMatchFromText(text: string): DocumentAnalysis['analysis'] {
    // Extract match score 
    const scoreMatch = text.match(/"matchScore":\s*(\d+)/);
    const matchScore = scoreMatch ? parseInt(scoreMatch[1]) : 70;
    
    // Extract difficulty
    const difficultyMatch = text.match(/"difficulty":\s*"([^"]*)/);
    const difficulty = difficultyMatch && ['junior', 'mid', 'senior', 'executive'].includes(difficultyMatch[1]) 
      ? difficultyMatch[1] as any : 'mid';
    
    return { 
      matchScore,
      strengths: this.extractArrayFromText(text, 'strengths') || [],
      gaps: this.extractArrayFromText(text, 'gaps') || [],
      focusAreas: this.extractArrayFromText(text, 'focusAreas') || [],
      difficulty,
      recommendations: this.extractArrayFromText(text, 'recommendations') || [],
      interviewQuestions: {
        technical: this.extractArrayFromText(text, 'technical') || [],
        behavioral: this.extractArrayFromText(text, 'behavioral') || [],
        situational: this.extractArrayFromText(text, 'situational') || [],
        gapFocused: this.extractArrayFromText(text, 'gapFocused') || [],
      },
    };
  }

  private extractArrayFromText(text: string, fieldName: string): string[] | null {
    // Match array in JSON format, even if incomplete 
    const regex = new RegExp(`"${fieldName}":\\s*\\[([^\\]]*(?:\\]|$))`, 'i');
    const match = text.match(regex);
    
    if (!match) return null;
    
    let arrayContent = match[1];
    
    // If array wasn't closed, try to extract items anyway
    if (!arrayContent.endsWith(']')) {
      arrayContent = arrayContent.replace(/,$/, ''); // Remove trailing comma
    } else {
      arrayContent = arrayContent.slice(0, -1); // Remove closing bracket
    }
    
    // Extract individual string items
    const items: string[] = [];
    const itemRegex = /"([^"]+)"/g;
    let itemMatch;
    
    while ((itemMatch = itemRegex.exec(arrayContent)) !== null) {
      items.push(itemMatch[1]);
    }
    
    return items.length > 0 ? items : null;
  }

  // Fallback methods for when Claude parsing fails
  private getFallbackJobAnalysis(jobDescription: string): DocumentAnalysis['jobDescription'] { 
    // Extract basic information using simple text processing as fallback
    const text = jobDescription.toLowerCase();
    
    return {
      requirements: [
        'Review job requirements carefully',
        'Prepare examples of relevant experience',
        'Research company background' 
      ],
      skills: [
        'Communication skills',
        'Problem-solving abilities',
        'Team collaboration',
        'Technical competency'
      ],
      experience: text.includes('senior') ? 'senior' : text.includes('junior') ? 'junior' : 'mid',
      responsibilities: [
        'Core job responsibilities',
        'Team collaboration tasks',
        'Project delivery duties'
      ],
      companyInfo: 'Company information to be researched',
      culture: ['Professional environment', 'Team-oriented culture']
    };
  }

  private getFallbackCVAnalysis(cv: string): DocumentAnalysis['cv'] {
    return { 
      skills: ['General professional skills', 'Technical abilities', 'Communication skills'],
      experience: ['Professional experience', 'Project involvement', 'Career progression'],
      achievements: ['Notable accomplishments', 'Key contributions'],
      education: ['Educational background', 'Relevant qualifications'],
      technologies: ['Technical tools', 'Software proficiency', 'Industry knowledge']
    };
  }

  private getFallbackMatchAnalysis(
    jdAnalysis: DocumentAnalysis['jobDescription'],
    cvAnalysis: DocumentAnalysis['cv']
  ): DocumentAnalysis['analysis'] { 
    return {
      matchScore: 70,
      strengths: ['General professional skills', 'Communication abilities', 'Technical background'],
      gaps: ['Specific technical skills', 'Industry experience', 'Domain knowledge'],
      focusAreas: ['Technical preparation', 'Company research', 'Industry trends'],
      difficulty: jdAnalysis.experience as any || 'mid',
      recommendations: [
        'Research the company thoroughly', 
        'Prepare specific examples',
        'Practice technical questions',
        'Review industry trends'
      ],
      interviewQuestions: {
        technical: [
          'Describe your technical experience',
          'How do you approach problem-solving?', 
          'What tools and technologies are you familiar with?',
          'Can you walk me through a technical project you worked on?'
        ],
        behavioral: [
          'Tell me about a time you overcame a challenge',
          'How do you handle working in a team?',
          'Describe a situation where you had to learn something new quickly',
          'How do you prioritize your work?'
        ],
        situational: [ 
          'How would you handle conflicting priorities?',
          'What would you do if you disagreed with a team decision?',
          'How would you approach learning our company\'s processes?',
          'How would you handle a tight deadline?'
        ],
        gapFocused: [
          'How do you stay updated with industry trends?',
          'What steps do you take to learn new technologies?',
          'How would you contribute to our team?',
          'What interests you most about this role?'
        ]
      }
    };
  }

  private getEmptyCVAnalysis(): DocumentAnalysis['cv'] { 
    return {
      skills: [],
      experience: [],
      achievements: [],
      education: [],
      technologies: [],
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