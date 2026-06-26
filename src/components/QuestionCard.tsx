import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AppContext';
import { PracticeQuestion, PracticeQuestionOption } from '../types';

interface QuestionCardProps {
  question: PracticeQuestion;
  onAnswer?: (questionId: string, selectedAnswer: string, isCorrect: boolean) => void;
  onBookmark?: (questionId: string) => void;
  showAnswer?: boolean;
  isBookmarked?: boolean;
  disabled?: boolean;
}

export default function QuestionCard({
  question,
  onAnswer,
  onBookmark,
  showAnswer = false,
  isBookmarked = false,
  disabled = false,
}: QuestionCardProps) {
  const { user, isGuestUser } = useAuth();
  
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  const handleAnswerSelect = (optionId: string) => {
    if (hasAnswered || disabled) return;

    if (isGuestUser()) {
      Alert.alert(
        'Login Required',
        'Please register or login to answer questions',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => {/* Navigate to login */} }
        ]
      );
      return;
    }

    setSelectedAnswer(optionId);
    setHasAnswered(true);
    
    const selectedOption = question.options.find(opt => opt.optionId === optionId);
    const isCorrect = selectedOption?.isCorrect || false;
    
    onAnswer?.(question.questionId, optionId, isCorrect);
  };

  const handleBookmark = () => {
    if (isGuestUser()) {
      Alert.alert(
        'Login Required',
        'Please register or login to bookmark questions'
      );
      return;
    }
    
    onBookmark?.(question.questionId);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return '#28a745';
      case 'medium': return '#ffc107';
      case 'hard': return '#dc3545';
      default: return '#555555';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'checkmark-circle';
      case 'medium': return 'warning';
      case 'hard': return 'flame';
      default: return 'help-circle';
    }
  };

  const getOptionStyle = (option: any) => {
    if (!hasAnswered && !showAnswer) {
      return styles.option;
    }

    if (option.optionId === selectedAnswer) {
      return option.isCorrect ? styles.optionCorrect : styles.optionIncorrect;
    }

    if (showAnswer && option.isCorrect) {
      return styles.optionCorrect;
    }

    return styles.optionDisabled;
  };

  const getOptionTextStyle = (option: PracticeQuestionOption) => {
    if (!hasAnswered && !showAnswer) {
      return styles.optionText;
    }

    if (option.optionId === selectedAnswer) {
      return styles.optionTextSelected;
    }

    if (showAnswer && option.isCorrect) {
      return styles.optionTextSelected;
    }

    return styles.optionTextDisabled;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[
            styles.difficultyBadge,
            { backgroundColor: getDifficultyColor(question.difficulty) }
          ]}>
            <Ionicons
              name={getDifficultyIcon(question.difficulty) as any}
              size={12}
              color="white"
            />
            <Text style={styles.difficultyText}>
              {question.difficulty.toUpperCase()}
            </Text>
          </View>
          
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{question.category}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.bookmarkButton, isBookmarked && styles.bookmarkButtonActive]}
            onPress={handleBookmark}
          >
            <Ionicons
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={isBookmarked ? '#00D084' : '#555555'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Question */}
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{question.questionText}</Text>
        
        {question.codeSnippet && (
          <View style={styles.codeContainer}>
            <Text style={styles.codeText}>{question.codeSnippet}</Text>
          </View>
        )}
      </View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {question.options.map((option, index) => (
          <TouchableOpacity
            key={option.optionId}
            style={getOptionStyle(option)}
            onPress={() => handleAnswerSelect(option.optionId)}
            disabled={hasAnswered || disabled}
          >
            <View style={styles.optionContent}>
              <View style={styles.optionLabel}>
                <Text style={styles.optionLabelText}>
                  {String.fromCharCode(65 + index)}
                </Text>
              </View>
              <Text style={getOptionTextStyle(option)}>
                {option.optionText}
              </Text>
              
              {(hasAnswered || showAnswer) && (
                <View style={styles.optionIcon}>
                  {option.isCorrect ? (
                    <Ionicons name="checkmark-circle" size={20} color="#28a745" />
                  ) : option.optionId === selectedAnswer ? (
                    <Ionicons name="close-circle" size={20} color="#dc3545" />
                  ) : null}
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Explanation */}
      {(hasAnswered || showAnswer) && question.explanation && (
        <View style={styles.explanationContainer}>
          <View style={styles.explanationHeader}>
            <Ionicons name="bulb" size={16} color="#ffc107" />
            <Text style={styles.explanationTitle}>Explanation</Text>
          </View>
          <Text style={styles.explanationText}>{question.explanation}</Text>
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Ionicons name="eye" size={14} color="#555555" />
          <Text style={styles.statText}>{question.viewCount || 0} views</Text>
        </View>
        
        <View style={styles.statItem}>
          <Ionicons name="checkmark-circle" size={14} color="#28a745" />
          <Text style={styles.statText}>
            {Math.round((question.correctAnswerCount || 0) / Math.max(question.attemptCount || 1, 1) * 100)}% correct
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Ionicons name="time" size={14} color="#555555" />
          <Text style={styles.statText}>
            {new Date(question.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0B0B0B',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0B0B0B',
    marginLeft: 4,
  },
  categoryBadge: {
    backgroundColor: '#161616',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#888888',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookmarkButton: {
    padding: 4,
  },
  bookmarkButtonActive: {
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
    borderRadius: 4,
  },
  questionContainer: {
    marginBottom: 16,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#E8F5E8',
    lineHeight: 24,
    marginBottom: 12,
  },
  codeContainer: {
    backgroundColor: '#161616',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#00D084',
  },
  codeText: {
    fontFamily: 'Courier New',
    fontSize: 14,
    color: '#E8F5E8',
    lineHeight: 20,
  },
  optionsContainer: {
    marginBottom: 16,
  },
  option: {
    borderWidth: 1,
    borderColor: '#1A1A1A',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#0B0B0B',
  },
  optionCorrect: {
    borderWidth: 2,
    borderColor: '#28a745',
    backgroundColor: 'rgba(40, 167, 69, 0.05)',
    marginBottom: 8,
    borderRadius: 8,
  },
  optionIncorrect: {
    borderWidth: 2,
    borderColor: '#dc3545',
    backgroundColor: 'rgba(220, 53, 69, 0.05)',
    marginBottom: 8,
    borderRadius: 8,
  },
  optionDisabled: {
    borderWidth: 1,
    borderColor: '#1A1A1A',
    backgroundColor: '#161616',
    marginBottom: 8,
    borderRadius: 8,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  optionLabel: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#00D084',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionLabelText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0B0B0B',
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: '#E8F5E8',
    lineHeight: 20,
  },
  optionTextSelected: {
    flex: 1,
    fontSize: 14,
    color: '#E8F5E8',
    lineHeight: 20,
    fontWeight: '500',
  },
  optionTextDisabled: {
    flex: 1,
    fontSize: 14,
    color: '#888888',
    lineHeight: 20,
  },
  optionIcon: {
    marginLeft: 8,
  },
  explanationContainer: {
    backgroundColor: '#2A2200',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
    marginLeft: 6,
  },
  explanationText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#888888',
    marginLeft: 4,
  },
});

