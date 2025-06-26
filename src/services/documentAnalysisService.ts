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
    const prompt = `Analyze this job description and extract key information:

JOB DESCRIPTION:
${jobDescription}

Please provide analysis in this JSON format:
{
  "requirements": ["requirement 1", "requirement 2", ...],
  "skills": ["skill 1", "skill 2", ...],
  "experience": "junior/mid/senior/executive level description",
  "responsibilities": ["responsibility 1", "responsibility 2", ...],
  "companyInfo": "company information summary",
  "culture": ["culture value 1", "culture value 2", ...]
}

Extract 5-7 key requirements, 5-7 technical and soft skills, 3-5 main responsibilities, and 2-3 company culture values.
Be specific and accurate in your extraction. Focus on the most important elements that would be relevant for interview preparation.`;

    // Create a context for Claude API
    const context: ConversationContext = {
      messages: [],
      mode: 'document-analysis',
      sessionId: `jd_analysis_${Date.now()}`,
      metadata: {
        startTime: new Date(),
        lastActivity: new Date(),
        messageCount: 0,
        totalTokens: 0,
      },
    };
    
    // Send the prompt to Claude
    const response = await supabaseClaudeAPI.sendMessage(prompt, context);
    
    if (response.error) {
      console.error('Job description analysis failed:', response.error);
      throw new Error(`Failed to analyze job description: ${response.error}`);
    }
    
    if (!response.data) {
      throw new Error('No analysis data received for job description');
    }
    
    // Extract JSON from Claude's response
    try {
      const jsonMatch = response.data.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Claude response');
      }
      
      const analysisData = JSON.parse(jsonMatch[0]);
      
      return {
        requirements: analysisData.requirements || [],
        skills: analysisData.skills || [],
        experience: analysisData.experience || 'mid',
        responsibilities: analysisData.responsibilities || [],
        companyInfo: analysisData.companyInfo || '',
        culture: analysisData.culture || [],
      };
    } catch (error) {
      console.error('Failed to parse job description analysis:', error);
      throw new Error('Failed to parse job description analysis');
    }
  }

  private async analyzeCV(cv: string): Promise<DocumentAnalysis['cv']> {
    const prompt = `Analyze this CV/Resume and extract key information:

CV/RESUME:
${cv}

Please provide analysis in this JSON format:
{
  "skills": ["skill 1", "skill 2", ...],
  "experience": ["experience 1", "experience 2", ...],
  "achievements": ["achievement 1", "achievement 2", ...],
  "education": ["education 1", "education 2", ...],
  "technologies": ["technology 1", "technology 2", ...]
}

Extract 5-7 key skills, 3-5 relevant experiences, 2-3 notable achievements, education details, and 5-7 technologies/tools.
Be specific and accurate in your extraction. Focus on the most important elements that would be relevant for interview preparation.`;

    // Create a context for Claude API
    const context: ConversationContext = {
      messages: [],
      mode: 'document-analysis',
      sessionId: `cv_analysis_${Date.now()}`,
      metadata: {
        startTime: new Date(),
        lastActivity: new Date(),
        messageCount: 0,
        totalTokens: 0,
      },
    };
    
    // Send the prompt to Claude
    const response = await supabaseClaudeAPI.sendMessage(prompt, context);
    
    if (response.error) {
      console.error('CV analysis failed:', response.error);
      throw new Error(`Failed to analyze CV: ${response.error}`);
    }
    
    if (!response.data) {
      throw new Error('No analysis data received for CV');
    }
    
    // Extract JSON from Claude's response
    try {
      const jsonMatch = response.data.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Claude response');
      }
      
      const analysisData = JSON.parse(jsonMatch[0]);
      
      return {
        skills: analysisData.skills || [],
        experience: analysisData.experience || [],
        achievements: analysisData.achievements || [],
        education: analysisData.education || [],
        technologies: analysisData.technologies || [],
      };
    } catch (error) {
      console.error('Failed to parse CV analysis:', error);
      throw new Error('Failed to parse CV analysis');
    }
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

  private async compareJDandCV(
    jdAnalysis: DocumentAnalysis['jobDescription'],
    cvAnalysis: DocumentAnalysis['cv'],
    jobDescription: string,
    cv: string
  ): Promise<DocumentAnalysis['analysis']> {
    const prompt = `Compare this job description analysis with CV analysis and provide match assessment:

JOB DESCRIPTION:
${jobDescription}

JOB REQUIREMENTS:
${JSON.stringify(jdAnalysis, null, 2)}

${cv ? `CV/RESUME:
${cv}

CANDIDATE PROFILE:
${JSON.stringify(cvAnalysis, null, 2)}` : 'CV/RESUME: Not provided'}

Provide detailed comparison analysis in this JSON format:
{
  "matchScore": 75,
  "strengths": ["strength 1", "strength 2", ...],
  "gaps": ["gap 1", "gap 2", ...],
  "focusAreas": ["focus area 1", "focus area 2", ...],
  "difficulty": "junior"|"mid"|"senior"|"executive",
  "recommendations": ["recommendation 1", "recommendation 2", ...],
  "interviewQuestions": {
    "technical": ["question 1", "question 2", ...],
    "behavioral": ["question 1", "question 2", ...],
    "situational": ["question 1", "question 2", ...],
    "gapFocused": ["question 1", "question 2", ...]
  }
}

If no CV was provided, make reasonable assumptions and focus on job-specific preparation.
Generate 4-5 interview questions for each category that are specifically tailored to this job and candidate.
The matchScore should be between 0-100, with higher scores indicating better matches.
Identify 3-5 strengths, 3-5 gaps, 3-5 focus areas, and 3-5 recommendations.
The difficulty should reflect the seniority level required for the position.`;

    // Create a context for Claude API
    const context: ConversationContext = {
      messages: [],
      mode: 'document-analysis',
      sessionId: `match_analysis_${Date.now()}`,
      metadata: {
        startTime: new Date(),
        lastActivity: new Date(),
        messageCount: 0,
        totalTokens: 0,
      },
    };
    
    // Send the prompt to Claude
    const response = await supabaseClaudeAPI.sendMessage(prompt, context);
    
    if (response.error) {
      console.error('Match analysis failed:', response.error);
      throw new Error(`Failed to analyze match: ${response.error}`);
    }
    
    if (!response.data) {
      throw new Error('No analysis data received for match');
    }
    
    // Extract JSON from Claude's response
    try {
      const jsonMatch = response.data.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Claude response');
      }
      
      const analysisData = JSON.parse(jsonMatch[0]);
      
      return {
        matchScore: analysisData.matchScore || 60,
        strengths: analysisData.strengths || [],
        gaps: analysisData.gaps || [],
        focusAreas: analysisData.focusAreas || [],
        difficulty: analysisData.difficulty || 'mid',
        recommendations: analysisData.recommendations || [],
        interviewQuestions: {
          technical: analysisData.interviewQuestions?.technical || [],
          behavioral: analysisData.interviewQuestions?.behavioral || [],
          situational: analysisData.interviewQuestions?.situational || [],
          gapFocused: analysisData.interviewQuestions?.gapFocused || [],
        },
      };
    } catch (error) {
      console.error('Failed to parse match analysis:', error);
      throw new Error('Failed to parse match analysis');
    }
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

  // Advanced JSON repair for Claude responses
  private advancedJsonRepair(jsonString: string): string {
    let repaired = jsonString;

    // Remove trailing commas before } or ]
    repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
    // Replace single quotes with double quotes
    repaired = repaired.replace(/'/g, '"');
    // Fix unquoted property names (very basic, not for nested objects)
    repaired = repaired.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
    // Remove any undefined/null trailing values
    repaired = repaired.replace(/:\s*undefined/g, ': null');
    repaired = repaired.replace(/:\s*null,/g, ': null,');
    // Remove any incomplete lines at the end
    repaired = repaired.replace(/("[^"]*":\s*".*?)(?:\n|$)/g, (m, p1) => (p1.endsWith('"') ? m : ''));
    // Fix missing closing brackets/braces
    const openBraces = (repaired.match(/\{/g) || []).length;
    const closeBraces = (repaired.match(/\}/g) || []).length;
    const openBrackets = (repaired.match(/\[/g) || []).length;
    const closeBrackets = (repaired.match(/\]/g) || []).length;
    for (let i = 0; i < openBraces - closeBraces; i++) repaired += '}';
    for (let i = 0; i < openBrackets - closeBrackets; i++) repaired += ']';
    // Remove any trailing incomplete string
    repaired = repaired.replace(/"([^"]*)$/, '""');
    return repaired;
  }

  private parseJobDescriptionResponse(responseContent: string): DocumentAnalysis['jobDescription'] {
    try {
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        let jsonStr = jsonMatch[0];
        try {
          return this.parseJobDescriptionJson(JSON.parse(jsonStr));
        } catch (e) {
          // Try advanced repair and parse again
          jsonStr = this.advancedJsonRepair(jsonStr);
          return this.parseJobDescriptionJson(JSON.parse(jsonStr));
        }
      }
      // Try parsing the whole response
      let jsonStr = responseContent.trim();
      try {
        return this.parseJobDescriptionJson(JSON.parse(jsonStr));
      } catch (e) {
        jsonStr = this.advancedJsonRepair(jsonStr);
        return this.parseJobDescriptionJson(JSON.parse(jsonStr));
      }
    } catch (error) {
      console.error('Failed to parse job description analysis:', error);
      console.log('Raw response:', responseContent);
      throw new Error('Failed to parse job description analysis');
    }
  }

  private parseMatchResponse(responseContent: string): DocumentAnalysis['analysis'] {
    try {
      // Strategy 1: Look for JSON object
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        let jsonStr = jsonMatch[0];
        try {
          return this.parseMatchJson(JSON.parse(jsonStr));
        } catch (e) {
          // Try advanced repair and parse again
          jsonStr = this.advancedJsonRepair(jsonStr);
          return this.parseMatchJson(JSON.parse(jsonStr));
        }
      }
      // Strategy 2: Try parsing the entire response as JSON
      let jsonStr = responseContent.trim();
      try {
        return this.parseMatchJson(JSON.parse(jsonStr));
      } catch (e) {
        jsonStr = this.advancedJsonRepair(jsonStr);
        return this.parseMatchJson(JSON.parse(jsonStr));
      }
    } catch (error) {
      console.error('Failed to parse match analysis:', error);
      console.log('Raw response:', responseContent);
      throw new Error('Failed to parse match analysis');
    }
  }

  private parseMatchJson(parsedData: any): DocumentAnalysis['analysis'] {
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

  private parseCVResponse(responseContent: string): DocumentAnalysis['cv'] {
    try {
      // Strategy 1: Look for JSON object
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        let jsonStr = jsonMatch[0];
        try {
          return this.parseCVJson(JSON.parse(jsonStr));
        } catch (e) {
          // Try advanced repair and parse again
          jsonStr = this.advancedJsonRepair(jsonStr);
          return this.parseCVJson(JSON.parse(jsonStr));
        }
      }
      // Strategy 2: Try parsing the entire response as JSON
      let jsonStr = responseContent.trim();
      try {
        return this.parseCVJson(JSON.parse(jsonStr));
      } catch (e) {
        jsonStr = this.advancedJsonRepair(jsonStr);
        return this.parseCVJson(JSON.parse(jsonStr));
      }
    } catch (error) {
      console.error('Failed to parse CV analysis:', error);
      console.log('Raw response:', responseContent);
      throw new Error('Failed to parse CV analysis');
    }
  }

  private parseCVJson(parsedData: any): DocumentAnalysis['cv'] {
    return {
      skills: Array.isArray(parsedData.skills) ? parsedData.skills : [],
      experience: Array.isArray(parsedData.experience) ? parsedData.experience : [],
      achievements: Array.isArray(parsedData.achievements) ? parsedData.achievements : [],
      education: Array.isArray(parsedData.education) ? parsedData.education : [],
      technologies: Array.isArray(parsedData.technologies) ? parsedData.technologies : [],
    };
  }
}

export const documentAnalysisService = new DocumentAnalysisService();