import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Star, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  AlertTriangle,
  ArrowRight,
  Award,
  BarChart3,
  Clock,
  MessageSquare,
  Volume2,
  Zap,
  Brain,
  X
} from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { FeedbackData } from '@/src/types';
import { spacing, typography } from '@/src/constants/colors';

interface DetailedFeedbackScreenProps {
  feedback: FeedbackData;
  conversationMode: string;
  conversationDuration: number;
  onClose: () => void;
}

export function DetailedFeedbackScreen({ 
  feedback, 
  conversationMode,
  conversationDuration,
  onClose 
}: DetailedFeedbackScreenProps) {
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'overview' | 'scores' | 'analytics' | 'tips'>('overview');

  const formatModeName = (mode: string) => {
    return mode.split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return colors.success;
    if (score >= 70) return colors.primary;
    if (score >= 50) return colors.warning;
    return colors.error;
  };

  const getChangeIcon = (change?: number) => {
    if (!change) return null;
    if (change > 0) return <TrendingUp size={16} color={colors.success} />;
    if (change < 0) return <TrendingDown size={16} color={colors.error} />;
    return null;
  };

  const renderScoreBar = (score: number, label: string) => (
    <View style={styles.scoreBarContainer}>
      <Text style={[styles.scoreBarLabel, { color: colors.text }]}>{label}</Text>
      <View style={[styles.scoreBarTrack, { backgroundColor: colors.border }]}>
        <View 
          style={[
            styles.scoreBarFill, 
            { 
              backgroundColor: getScoreColor(score),
              width: `${score}%` 
            }
          ]}
        />
      </View>
      <Text style={[styles.scoreBarValue, { color: getScoreColor(score) }]}>{score}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <X size={24} color="white" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Feedback Analysis</Text>
          
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.headerContent}>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabelText}>Overall Score</Text>
            <Text style={styles.scoreText}>{feedback.scores.overall}</Text>
            {feedback.progressTracking?.improvement !== undefined && (
              <View style={styles.changeContainer}>
                {getChangeIcon(feedback.progressTracking.improvement)}
                <Text style={styles.changeText}>
                  {feedback.progressTracking.improvement > 0 ? '+' : ''}
                  {feedback.progressTracking.improvement}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.sessionInfo}>
            <View style={styles.infoItem}>
              <Award size={16} color="rgba(255, 255, 255, 0.9)" />
              <Text style={styles.infoText}>
                {formatModeName(conversationMode)}
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Clock size={16} color="rgba(255, 255, 255, 0.9)" />
              <Text style={styles.infoText}>
                {formatDuration(conversationDuration)}
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <MessageSquare size={16} color="rgba(255, 255, 255, 0.9)" />
              <Text style={styles.infoText}>
                {feedback.analytics.questionCount || 0} questions
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'overview' && { backgroundColor: colors.primary },
            { borderColor: colors.border }
          ]}
          onPress={() => setActiveTab('overview')}
        >
          <Star size={16} color={activeTab === 'overview' ? 'white' : colors.textSecondary} />
          <Text style={[
            styles.tabText,
            { color: activeTab === 'overview' ? 'white' : colors.textSecondary }
          ]}>
            Overview
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'scores' && { backgroundColor: colors.primary },
            { borderColor: colors.border }
          ]}
          onPress={() => setActiveTab('scores')}
        >
          <BarChart3 size={16} color={activeTab === 'scores' ? 'white' : colors.textSecondary} />
          <Text style={[
            styles.tabText,
            { color: activeTab === 'scores' ? 'white' : colors.textSecondary }
          ]}>
            Scores
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'analytics' && { backgroundColor: colors.primary },
            { borderColor: colors.border }
          ]}
          onPress={() => setActiveTab('analytics')}
        >
          <Brain size={16} color={activeTab === 'analytics' ? 'white' : colors.textSecondary} />
          <Text style={[
            styles.tabText,
            { color: activeTab === 'analytics' ? 'white' : colors.textSecondary }
          ]}>
            Analytics
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'tips' && { backgroundColor: colors.primary },
            { borderColor: colors.border }
          ]}
          onPress={() => setActiveTab('tips')}
        >
          <Zap size={16} color={activeTab === 'tips' ? 'white' : colors.textSecondary} />
          <Text style={[
            styles.tabText,
            { color: activeTab === 'tips' ? 'white' : colors.textSecondary }
          ]}>
            Tips
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'overview' && (
          <View style={styles.overviewTab}>
            {/* Strengths */}
            <View style={[styles.section, { backgroundColor: colors.surface }]}>
              <View style={styles.sectionHeader}>
                <CheckCircle size={20} color={colors.success} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Your Strengths
                </Text>
              </View>
              
              {feedback.strengths.map((strength, index) => (
                <View key={index} style={styles.listItem}>
                  <View style={[styles.listBullet, { backgroundColor: colors.success }]} />
                  <Text style={[styles.listText, { color: colors.text }]}>{strength}</Text>
                </View>
              ))}
            </View>

            {/* Improvements */}
            <View style={[styles.section, { backgroundColor: colors.surface }]}>
              <View style={styles.sectionHeader}>
                <AlertTriangle size={20} color={colors.warning} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Areas for Improvement
                </Text>
              </View>
              
              {feedback.improvements.map((improvement, index) => (
                <View key={index} style={styles.listItem}>
                  <View style={[styles.listBullet, { backgroundColor: colors.warning }]} />
                  <Text style={[styles.listText, { color: colors.text }]}>{improvement}</Text>
                </View>
              ))}
            </View>

            {/* Progress Tracking */}
            {feedback.progressTracking && (
              <View style={[styles.section, { backgroundColor: colors.surface }]}>
                <View style={styles.sectionHeader}>
                  <TrendingUp size={20} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Your Progress
                  </Text>
                </View>
                
                <View style={styles.progressContainer}>
                  <View style={styles.progressItem}>
                    <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
                      Previous Score
                    </Text>
                    <Text style={[styles.progressValue, { color: colors.text }]}>
                      {feedback.progressTracking.previousScore}
                    </Text>
                  </View>
                  
                  <View style={styles.progressArrow}>
                    <ArrowRight size={20} color={colors.textSecondary} />
                  </View>
                  
                  <View style={styles.progressItem}>
                    <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
                      Current Score
                    </Text>
                    <Text style={[styles.progressValue, { color: colors.text }]}>
                      {feedback.scores.overall}
                    </Text>
                  </View>
                  
                  <View style={styles.progressChange}>
                    <View style={[
                      styles.changeIndicator,
                      { 
                        backgroundColor: feedback.progressTracking.improvement >= 0 
                          ? colors.success 
                          : colors.error 
                      }
                    ]}>
                      {feedback.progressTracking.improvement >= 0 
                        ? <TrendingUp size={16} color="white" />
                        : <TrendingDown size={16} color="white" />
                      }
                    </View>
                    <Text style={[
                      styles.changeValue,
                      { 
                        color: feedback.progressTracking.improvement >= 0 
                          ? colors.success 
                          : colors.error 
                      }
                    ]}>
                      {feedback.progressTracking.improvement > 0 ? '+' : ''}
                      {feedback.progressTracking.improvement}
                    </Text>
                  </View>
                </View>
                
                {feedback.progressTracking.consistentStrengths.length > 0 && (
                  <View style={styles.consistentStrengths}>
                    <Text style={[styles.consistentLabel, { color: colors.text }]}>
                      Consistent Strengths:
                    </Text>
                    {feedback.progressTracking.consistentStrengths.map((strength, index) => (
                      <View key={index} style={styles.listItem}>
                        <View style={[styles.listBullet, { backgroundColor: colors.success }]} />
                        <Text style={[styles.listText, { color: colors.text }]}>{strength}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {activeTab === 'scores' && (
          <View style={styles.scoresTab}>
            {/* Core Scores */}
            <View style={[styles.section, { backgroundColor: colors.surface }]}>
              <View style={styles.sectionHeader}>
                <Star size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Core Communication Skills
                </Text>
              </View>
              
              {renderScoreBar(feedback.scores.fluency, 'Fluency')}
              {renderScoreBar(feedback.scores.clarity, 'Clarity')}
              {renderScoreBar(feedback.scores.confidence, 'Confidence')}
              {renderScoreBar(feedback.scores.pace, 'Pace')}
              {feedback.scores.engagement !== undefined && 
                renderScoreBar(feedback.scores.engagement, 'Engagement')}
            </View>

            {/* Mode-Specific Scores */}
            {feedback.modeSpecific && (
              <View style={[styles.section, { backgroundColor: colors.surface }]}>
                <View style={styles.sectionHeader}>
                  <Award size={20} color={colors.secondary} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    {formatModeName(conversationMode)} Skills
                  </Text>
                </View>
                
                {feedback.modeSpecific.generalChat && (
                  <>
                    {renderScoreBar(feedback.modeSpecific.generalChat.conversationFlow, 'Conversation Flow')}
                    {renderScoreBar(feedback.modeSpecific.generalChat.topicExploration, 'Topic Exploration')}
                    {renderScoreBar(feedback.modeSpecific.generalChat.empathyScore, 'Empathy')}
                    {renderScoreBar(feedback.modeSpecific.generalChat.curiosityLevel, 'Curiosity')}
                  </>
                )}
                
                {feedback.modeSpecific.debate && (
                  <>
                    {renderScoreBar(feedback.modeSpecific.debate.argumentStrength, 'Argument Strength')}
                    {renderScoreBar(feedback.modeSpecific.debate.evidenceUsage, 'Evidence Usage')}
                    {renderScoreBar(feedback.modeSpecific.debate.counterArgumentHandling, 'Counter-Argument Handling')}
                    {renderScoreBar(feedback.modeSpecific.debate.logicalConsistency, 'Logical Consistency')}
                  </>
                )}
                
                {feedback.modeSpecific.brainstorm && (
                  <>
                    {renderScoreBar(feedback.modeSpecific.brainstorm.ideaQuality, 'Idea Quality')}
                    {renderScoreBar(feedback.modeSpecific.brainstorm.buildingOnIdeas, 'Building on Ideas')}
                  </>
                )}
                
                {feedback.modeSpecific.interview && (
                  <>
                    {renderScoreBar(feedback.modeSpecific.interview.questionRelevance, 'Question Relevance')}
                    {renderScoreBar(feedback.modeSpecific.interview.answerCompleteness, 'Answer Completeness')}
                    {renderScoreBar(feedback.modeSpecific.interview.professionalDemeanor, 'Professional Demeanor')}
                    {renderScoreBar(feedback.modeSpecific.interview.technicalAccuracy, 'Technical Accuracy')}
                  </>
                )}
                
                {feedback.modeSpecific.presentation && (
                  <>
                    {renderScoreBar(feedback.modeSpecific.presentation.structureQuality, 'Structure Quality')}
                    {renderScoreBar(feedback.modeSpecific.presentation.audienceEngagement, 'Audience Engagement')}
                    {renderScoreBar(feedback.modeSpecific.presentation.messageClarity, 'Message Clarity')}
                    {renderScoreBar(feedback.modeSpecific.presentation.deliveryStyle, 'Delivery Style')}
                  </>
                )}
                
                {feedback.modeSpecific.languageLearning && (
                  <>
                    {renderScoreBar(feedback.modeSpecific.languageLearning.grammarAccuracy, 'Grammar Accuracy')}
                    {renderScoreBar(feedback.modeSpecific.languageLearning.vocabularyRange, 'Vocabulary Range')}
                    {renderScoreBar(feedback.modeSpecific.languageLearning.pronunciationScore, 'Pronunciation')}
                    {renderScoreBar(feedback.modeSpecific.languageLearning.fluencyProgress, 'Fluency Progress')}
                  </>
                )}
              </View>
            )}

            {/* Additional Scores */}
            <View style={[styles.section, { backgroundColor: colors.surface }]}>
              <View style={styles.sectionHeader}>
                <Zap size={20} color={colors.accent} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Additional Metrics
                </Text>
              </View>
              
              {feedback.scores.relevance !== undefined && 
                renderScoreBar(feedback.scores.relevance, 'Topic Relevance')}
              {feedback.scores.structure !== undefined && 
                renderScoreBar(feedback.scores.structure, 'Structure')}
              {feedback.scores.persuasiveness !== undefined && 
                renderScoreBar(feedback.scores.persuasiveness, 'Persuasiveness')}
              {feedback.scores.creativity !== undefined && 
                renderScoreBar(feedback.scores.creativity, 'Creativity')}
              {feedback.scores.criticalThinking !== undefined && 
                renderScoreBar(feedback.scores.criticalThinking, 'Critical Thinking')}
              {feedback.scores.emotionalIntelligence !== undefined && 
                renderScoreBar(feedback.scores.emotionalIntelligence, 'Emotional Intelligence')}
              {feedback.scores.vocabularyUsage !== undefined && 
                renderScoreBar(feedback.scores.vocabularyUsage, 'Vocabulary Usage')}
              {feedback.scores.grammarAccuracy !== undefined && 
                renderScoreBar(feedback.scores.grammarAccuracy, 'Grammar Accuracy')}
              {feedback.scores.professionalCommunication !== undefined && 
                renderScoreBar(feedback.scores.professionalCommunication, 'Professional Communication')}
            </View>
          </View>
        )}

        {activeTab === 'analytics' && (
          <View style={styles.analyticsTab}>
            {/* Communication Metrics */}
            <View style={[styles.section, { backgroundColor: colors.surface }]}>
              <View style={styles.sectionHeader}>
                <Volume2 size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Speaking Metrics
                </Text>
              </View>
              
              <View style={styles.metricsGrid}>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricValue, { color: colors.primary }]}>
                    {feedback.analytics.wordsPerMinute}
                  </Text>
                  <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                    Words/Min
                  </Text>
                </View>
                
                <View style={styles.metricItem}>
                  <Text style={[styles.metricValue, { color: colors.primary }]}>
                    {feedback.analytics.pauseCount}
                  </Text>
                  <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                    Pauses
                  </Text>
                </View>
                
                <View style={styles.metricItem}>
                  <Text style={[styles.metricValue, { color: colors.primary }]}>
                    {feedback.analytics.fillerWords}
                  </Text>
                  <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                    Filler Words
                  </Text>
                </View>
              </View>
              
              {feedback.analytics.complexSentences !== undefined && (
                <View style={styles.metricsGrid}>
                  <View style={styles.metricItem}>
                    <Text style={[styles.metricValue, { color: colors.secondary }]}>
                      {feedback.analytics.complexSentences}
                    </Text>
                    <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                      Words/Sentence
                    </Text>
                  </View>
                  
                  {feedback.analytics.questionCount !== undefined && (
                    <View style={styles.metricItem}>
                      <Text style={[styles.metricValue, { color: colors.secondary }]}>
                        {feedback.analytics.questionCount}
                      </Text>
                      <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                        Questions
                      </Text>
                    </View>
                  )}
                  
                  {feedback.analytics.responseTime !== undefined && (
                    <View style={styles.metricItem}>
                      <Text style={[styles.metricValue, { color: colors.secondary }]}>
                        {feedback.analytics.responseTime}s
                      </Text>
                      <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                        Avg Response
                      </Text>
                    </View>
                  )}
                </View>
              )}
              
              {(feedback.analytics.speakingTime !== undefined && 
                feedback.analytics.listeningTime !== undefined) && (
                <View style={styles.timeDistribution}>
                  <Text style={[styles.timeDistributionTitle, { color: colors.text }]}>
                    Speaking vs. Listening
                  </Text>
                  
                  <View style={styles.timeBar}>
                    <View 
                      style={[
                        styles.speakingTime, 
                        { 
                          backgroundColor: colors.primary,
                          width: `${(feedback.analytics.speakingTime / (feedback.analytics.speakingTime + feedback.analytics.listeningTime)) * 100}%` 
                        }
                      ]} 
                    />
                    <View 
                      style={[
                        styles.listeningTime, 
                        { 
                          backgroundColor: colors.secondary,
                          width: `${(feedback.analytics.listeningTime / (feedback.analytics.speakingTime + feedback.analytics.listeningTime)) * 100}%` 
                        }
                      ]} 
                    />
                  </View>
                  
                  <View style={styles.timeLabels}>
                    <View style={styles.timeLabel}>
                      <View style={[styles.timeLabelColor, { backgroundColor: colors.primary }]} />
                      <Text style={[styles.timeLabelText, { color: colors.textSecondary }]}>
                        Speaking: {feedback.analytics.speakingTime} min
                      </Text>
                    </View>
                    
                    <View style={styles.timeLabel}>
                      <View style={[styles.timeLabelColor, { backgroundColor: colors.secondary }]} />
                      <Text style={[styles.timeLabelText, { color: colors.textSecondary }]}>
                        Listening: {feedback.analytics.listeningTime} min
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Mode-Specific Analytics */}
            {feedback.modeSpecific && (
              <View style={[styles.section, { backgroundColor: colors.surface }]}>
                <View style={styles.sectionHeader}>
                  <Award size={20} color={colors.secondary} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    {formatModeName(conversationMode)} Analytics
                  </Text>
                </View>
                
                {feedback.modeSpecific.brainstorm && (
                  <View style={styles.metricsGrid}>
                    <View style={styles.metricItem}>
                      <Text style={[styles.metricValue, { color: colors.primary }]}>
                        {feedback.modeSpecific.brainstorm.ideaCount}
                      </Text>
                      <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                        Total Ideas
                      </Text>
                    </View>
                    
                    <View style={styles.metricItem}>
                      <Text style={[styles.metricValue, { color: colors.primary }]}>
                        {feedback.modeSpecific.brainstorm.uniqueIdeas}
                      </Text>
                      <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                        Unique Ideas
                      </Text>
                    </View>
                  </View>
                )}
                
                {feedback.modeSpecific.languageLearning && (
                  <View style={styles.metricsGrid}>
                    <View style={styles.metricItem}>
                      <Text style={[styles.metricValue, { color: colors.primary }]}>
                        {feedback.modeSpecific.languageLearning.grammarAccuracy}%
                      </Text>
                      <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                        Grammar
                      </Text>
                    </View>
                    
                    <View style={styles.metricItem}>
                      <Text style={[styles.metricValue, { color: colors.primary }]}>
                        {feedback.modeSpecific.languageLearning.pronunciationScore}%
                      </Text>
                      <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                        Pronunciation
                      </Text>
                    </View>
                  </View>
                )}
                
                {feedback.analytics.topicChanges !== undefined && (
                  <View style={styles.metricsGrid}>
                    <View style={styles.metricItem}>
                      <Text style={[styles.metricValue, { color: colors.secondary }]}>
                        {feedback.analytics.topicChanges}
                      </Text>
                      <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                        Topic Changes
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {activeTab === 'tips' && (
          <View style={styles.tipsTab}>
            {/* Practical Tips */}
            <View style={[styles.section, { backgroundColor: colors.surface }]}>
              <View style={styles.sectionHeader}>
                <Zap size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Practical Tips
                </Text>
              </View>
              
              {feedback.tips.map((tip, index) => (
                <View key={index} style={styles.listItem}>
                  <View style={[styles.listBullet, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.listText, { color: colors.text }]}>{tip}</Text>
                </View>
              ))}
            </View>

            {/* Next Steps */}
            <View style={[styles.section, { backgroundColor: colors.surface }]}>
              <View style={styles.sectionHeader}>
                <ArrowRight size={20} color={colors.secondary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Recommended Next Steps
                </Text>
              </View>
              
              {feedback.nextSteps.map((step, index) => (
                <View key={index} style={styles.listItem}>
                  <View style={[styles.listBullet, { backgroundColor: colors.secondary }]} />
                  <Text style={[styles.listText, { color: colors.text }]}>{step}</Text>
                </View>
              ))}
            </View>

            {/* Mode-Specific Practice Suggestions */}
            <View style={[styles.section, { backgroundColor: colors.surface }]}>
              <View style={styles.sectionHeader}>
                <Award size={20} color={colors.accent} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {formatModeName(conversationMode)} Practice
                </Text>
              </View>
              
              {getModeSpecificPractice(conversationMode).map((practice, index) => (
                <View key={index} style={styles.practiceItem}>
                  <View style={[styles.practiceNumber, { backgroundColor: colors.accent }]}>
                    <Text style={styles.practiceNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.practiceContent}>
                    <Text style={[styles.practiceTitle, { color: colors.text }]}>
                      {practice.title}
                    </Text>
                    <Text style={[styles.practiceDescription, { color: colors.textSecondary }]}>
                      {practice.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function getModeSpecificPractice(mode: string): Array<{ title: string; description: string }> {
  switch (mode) {
    case 'general-chat':
      return [
        {
          title: 'Active Listening Challenge',
          description: 'Practice summarizing what the other person said before responding to ensure you're fully understanding them.'
        },
        {
          title: 'Topic Transition Exercise',
          description: 'Practice smoothly changing topics by finding natural connections between different subjects.'
        },
        {
          title: 'Question Variety Drill',
          description: 'Try to use different types of questions (open, closed, follow-up, clarifying) in your next conversation.'
        }
      ];
      
    case 'debate-challenge':
      return [
        {
          title: 'Argument Structure Practice',
          description: 'Practice the claim-evidence-reasoning format for making stronger arguments.'
        },
        {
          title: 'Counter-Argument Anticipation',
          description: 'Before your next debate, list potential counter-arguments to your position and prepare responses.'
        },
        {
          title: 'Evidence Collection Exercise',
          description: 'Research and collect evidence for both sides of an argument to strengthen your position.'
        }
      ];
      
    case 'idea-brainstorm':
      return [
        {
          title: 'Rapid Ideation Sprint',
          description: 'Set a timer for 5 minutes and generate as many ideas as possible without judging them.'
        },
        {
          title: 'Constraint-Based Creativity',
          description: 'Practice generating ideas with specific constraints (e.g., must cost under $10, must use existing technology).'
        },
        {
          title: 'Idea Combination Technique',
          description: 'Take two unrelated concepts and practice finding innovative ways to combine them.'
        }
      ];
      
    case 'interview-practice':
      return [
        {
          title: 'STAR Method Drill',
          description: 'Practice structuring answers using Situation, Task, Action, Result format for behavioral questions.'
        },
        {
          title: 'Technical Explanation Exercise',
          description: 'Practice explaining complex technical concepts in simple, clear language.'
        },
        {
          title: 'Question Preparation',
          description: 'Research and prepare thoughtful questions to ask the interviewer at the end of your next practice session.'
        }
      ];
      
    case 'presentation-prep':
      return [
        {
          title: 'Opening Hook Practice',
          description: 'Create and practice 5 different attention-grabbing openings for your presentation.'
        },
        {
          title: 'Pacing and Pausing Exercise',
          description: 'Practice your presentation with deliberate pauses after key points for emphasis.'
        },
        {
          title: 'Audience Engagement Techniques',
          description: 'Incorporate rhetorical questions, stories, or interactive elements to engage your audience.'
        }
      ];
      
    case 'language-learning':
      return [
        {
          title: 'Pronunciation Focus',
          description: 'Record yourself speaking and identify specific sounds or words to practice repeatedly.'
        },
        {
          title: 'Vocabulary Expansion',
          description: 'Choose a topic and learn 10 new related words to use in your next conversation.'
        },
        {
          title: 'Grammar Pattern Practice',
          description: 'Focus on one grammar pattern and use it repeatedly in different contexts during conversation.'
        }
      ];
      
    default:
      return [
        {
          title: 'Communication Practice',
          description: 'Focus on clear and concise communication in your next conversation.'
        },
        {
          title: 'Active Listening Exercise',
          description: 'Practice summarizing what others say before responding.'
        },
        {
          title: 'Feedback Implementation',
          description: 'Choose one area of improvement and focus specifically on it in your next session.'
        }
      ];
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  closeButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  scoreContainer: {
    alignItems: 'flex-start',
  },
  scoreLabelText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: typography.sizes.sm,
    marginBottom: spacing.xs,
  },
  scoreText: {
    color: 'white',
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  changeText: {
    color: 'white',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginLeft: spacing.xs / 2,
  },
  sessionInfo: {
    alignItems: 'flex-end',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  infoText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: typography.sizes.sm,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.xs,
  },
  tabText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  overviewTab: {
    gap: spacing.lg,
  },
  scoresTab: {
    gap: spacing.lg,
  },
  analyticsTab: {
    gap: spacing.lg,
  },
  tipsTab: {
    gap: spacing.lg,
  },
  section: {
    padding: spacing.lg,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  listBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: spacing.sm,
  },
  listText: {
    flex: 1,
    fontSize: typography.sizes.base,
    lineHeight: typography.sizes.base * 1.4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  progressItem: {
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: typography.sizes.sm,
    marginBottom: spacing.xs,
  },
  progressValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  progressArrow: {
    marginHorizontal: spacing.sm,
  },
  progressChange: {
    alignItems: 'center',
  },
  changeIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  changeValue: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  consistentStrengths: {
    marginTop: spacing.md,
  },
  consistentLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.sm,
  },
  scoreBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  scoreBarLabel: {
    width: 120,
    fontSize: typography.sizes.sm,
  },
  scoreBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  scoreBarValue: {
    width: 40,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    textAlign: 'right',
    marginLeft: spacing.sm,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  },
  metricLabel: {
    fontSize: typography.sizes.xs,
    textAlign: 'center',
  },
  timeDistribution: {
    marginTop: spacing.md,
  },
  timeDistributionTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.sm,
  },
  timeBar: {
    flexDirection: 'row',
    height: 20,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  speakingTime: {
    height: '100%',
  },
  listeningTime: {
    height: '100%',
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  timeLabelColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timeLabelText: {
    fontSize: typography.sizes.xs,
  },
  practiceItem: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  practiceNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  practiceNumberText: {
    color: 'white',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  practiceContent: {
    flex: 1,
  },
  practiceTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
  },
  practiceDescription: {
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * 1.4,
  },
});