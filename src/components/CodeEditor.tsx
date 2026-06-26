import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AppContext';
import { Question, Submission, TestCase } from '../types';

interface CodeEditorProps {
  question: Question;
  onSubmit?: (code: string, language: string) => void;
  onRun?: (code: string, language: string) => void;
  isSubmitting?: boolean;
  isRunning?: boolean;
  testResults?: TestResult[];
  submission?: Submission;
}

interface TestResult {
  testCase: TestCase;
  passed: boolean;
  actualOutput?: string;
  error?: string;
  executionTime?: number;
}

const LANGUAGES = [
  { id: 'javascript', name: 'JavaScript', icon: 'logo-javascript' },
  { id: 'python', name: 'Python', icon: 'logo-python' },
  { id: 'java', name: 'Java', icon: 'cafe' },
  { id: 'cpp', name: 'C++', icon: 'code-slash' },
  { id: 'typescript', name: 'TypeScript', icon: 'logo-javascript' },
];

const CODE_TEMPLATES = {
  javascript: `function solution() {
    // Write your solution here
    
    return result;
}`,
  python: `def solution():
    # Write your solution here
    
    return result`,
  java: `public class Solution {
    public static void main(String[] args) {
        // Write your solution here
        
    }
}`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    // Write your solution here
    
    return 0;
}`,
  typescript: `function solution(): any {
    // Write your solution here
    
    return result;
}`,
};

export default function CodeEditor({
  question,
  onSubmit,
  onRun,
  isSubmitting = false,
  isRunning = false,
  testResults = [],
  submission,
}: CodeEditorProps) {
  const { user, isGuestUser } = useAuth();
  const { width } = Dimensions.get('window');
  
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState(CODE_TEMPLATES.javascript);
  const [showTestCases, setShowTestCases] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [showHints, setShowHints] = useState(false);
  const [currentHint, setCurrentHint] = useState(0);
  
  const codeInputRef = useRef<TextInput>(null);

  const handleLanguageChange = (languageId: string) => {
    setSelectedLanguage(languageId);
    setCode(CODE_TEMPLATES[languageId as keyof typeof CODE_TEMPLATES] || '');
  };

  const handleRun = () => {
    if (!code.trim()) {
      Alert.alert('Error', 'Please write some code first');
      return;
    }

    if (isGuestUser()) {
      Alert.alert(
        'Login Required',
        'Please register or login to run code',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => {/* Navigate to login */} }
        ]
      );
      return;
    }

    onRun?.(code, selectedLanguage);
  };

  const handleSubmit = () => {
    if (!code.trim()) {
      Alert.alert('Error', 'Please write some code first');
      return;
    }

    if (isGuestUser()) {
      Alert.alert(
        'Login Required',
        'Please register or login to submit solutions',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => {/* Navigate to login */} }
        ]
      );
      return;
    }

    Alert.alert(
      'Submit Solution',
      'Are you sure you want to submit your solution?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Submit', onPress: () => onSubmit?.(code, selectedLanguage) }
      ]
    );
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Code',
      'This will reset your code to the template. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => {
            setCode(CODE_TEMPLATES[selectedLanguage as keyof typeof CODE_TEMPLATES] || '');
          }
        }
      ]
    );
  };

  const handleShowHint = () => {
    if (!question.hints || question.hints.length === 0) {
      Alert.alert('No Hints', 'No hints available for this question');
      return;
    }
    setShowHints(true);
  };

  const nextHint = () => {
    if (question.hints && currentHint < question.hints.length - 1) {
      setCurrentHint(prev => prev + 1);
    }
  };

  const prevHint = () => {
    if (currentHint > 0) {
      setCurrentHint(prev => prev - 1);
    }
  };

  const getTestResultIcon = (result: TestResult) => {
    if (result.passed) {
      return <Ionicons name="checkmark-circle" size={16} color="#00D084" />;
    } else {
      return <Ionicons name="close-circle" size={16} color="#dc3545" />;
    }
  };

  const getSubmissionStatusColor = (status: string) => {
    switch (status) {
      case 'CORRECT': return '#00D084';
      case 'INCORRECT': return '#dc3545';
      case 'PARTIAL': return '#ffc107';
      default: return '#555555';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.questionTitle} numberOfLines={1}>
            {question.title}
          </Text>
          <View style={[
            styles.difficultyBadge,
            { backgroundColor: question.difficulty === 'EASY' ? '#00D084' : 
                               question.difficulty === 'MEDIUM' ? '#ffc107' : '#dc3545' }
          ]}>
            <Text style={styles.difficultyText}>{question.difficulty}</Text>
          </View>
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton} onPress={handleShowHint}>
            <Ionicons name="bulb" size={16} color="#ffc107" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => setShowTestCases(!showTestCases)}
          >
            <Ionicons name="list" size={16} color="#00D084" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Language Selector */}
      <View style={styles.languageSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.id}
              style={[
                styles.languageButton,
                selectedLanguage === lang.id && styles.languageButtonActive
              ]}
              onPress={() => handleLanguageChange(lang.id)}
            >
              <Ionicons
                name={lang.icon as any}
                size={16}
                color={selectedLanguage === lang.id ? '#E8F5E8' : '#555555'}
              />
              <Text style={[
                styles.languageText,
                selectedLanguage === lang.id && styles.languageTextActive
              ]}>
                {lang.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Code Editor */}
      <View style={styles.editorContainer}>
        <View style={styles.editorHeader}>
          <Text style={styles.editorTitle}>Code Editor</Text>
          <View style={styles.editorControls}>
            <TouchableOpacity
              style={styles.fontButton}
              onPress={() => setFontSize(Math.max(12, fontSize - 1))}
            >
              <Ionicons name="remove" size={14} color="#555555" />
            </TouchableOpacity>
            <Text style={styles.fontSizeText}>{fontSize}px</Text>
            <TouchableOpacity
              style={styles.fontButton}
              onPress={() => setFontSize(Math.min(20, fontSize + 1))}
            >
              <Ionicons name="add" size={14} color="#555555" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Ionicons name="refresh" size={14} color="#dc3545" />
            </TouchableOpacity>
          </View>
        </View>
        
        <ScrollView style={styles.codeScrollView} nestedScrollEnabled>
          <TextInput
            ref={codeInputRef}
            style={[styles.codeInput, { fontSize }]}
            value={code}
            onChangeText={setCode}
            multiline
            placeholder="Write your code here..."
            placeholderTextColor="#999"
            textAlignVertical="top"
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            scrollEnabled={false}
          />
        </ScrollView>
      </View>

      {/* Test Cases */}
      {showTestCases && (
        <View style={styles.testCasesContainer}>
          <Text style={styles.testCasesTitle}>Test Cases</Text>
          <ScrollView style={styles.testCasesList}>
            {question.testCases.map((testCase, index) => (
              <View key={index} style={styles.testCase}>
                <View style={styles.testCaseHeader}>
                  <Text style={styles.testCaseTitle}>Test Case {index + 1}</Text>
                  {testResults[index] && getTestResultIcon(testResults[index])}
                </View>
                
                <View style={styles.testCaseContent}>
                  <View style={styles.testCaseSection}>
                    <Text style={styles.testCaseLabel}>Input:</Text>
                    <Text style={styles.testCaseValue}>{testCase.input}</Text>
                  </View>
                  
                  <View style={styles.testCaseSection}>
                    <Text style={styles.testCaseLabel}>Expected Output:</Text>
                    <Text style={styles.testCaseValue}>{testCase.expectedOutput}</Text>
                  </View>
                  
                  {testResults[index] && testResults[index].actualOutput && (
                    <View style={styles.testCaseSection}>
                      <Text style={styles.testCaseLabel}>Your Output:</Text>
                      <Text style={[
                        styles.testCaseValue,
                        { color: testResults[index].passed ? '#00D084' : '#dc3545' }
                      ]}>
                        {testResults[index].actualOutput}
                      </Text>
                    </View>
                  )}
                  
                  {testResults[index] && testResults[index].error && (
                    <View style={styles.testCaseSection}>
                      <Text style={styles.testCaseLabel}>Error:</Text>
                      <Text style={[styles.testCaseValue, { color: '#dc3545' }]}>
                        {testResults[index].error}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.runButton, isRunning && styles.buttonDisabled]}
          onPress={handleRun}
          disabled={isRunning || isSubmitting}
        >
          {isRunning ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="play" size={16} color="white" />
              <Text style={styles.runButtonText}>Run</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isRunning || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="checkmark" size={16} color="white" />
              <Text style={styles.submitButtonText}>Submit</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Hints Modal */}
      {showHints && question.hints && (
        <View style={styles.hintsOverlay}>
          <View style={styles.hintsModal}>
            <View style={styles.hintsHeader}>
              <Text style={styles.hintsTitle}>
                Hint {currentHint + 1} of {question.hints.length}
              </Text>
              <TouchableOpacity
                style={styles.hintsCloseButton}
                onPress={() => setShowHints(false)}
              >
                <Ionicons name="close" size={20} color="#555555" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.hintText}>{question.hints[currentHint]}</Text>
            
            <View style={styles.hintsNavigation}>
              <TouchableOpacity
                style={[styles.hintNavButton, currentHint === 0 && styles.hintNavButtonDisabled]}
                onPress={prevHint}
                disabled={currentHint === 0}
              >
                <Ionicons name="chevron-back" size={16} color={currentHint === 0 ? '#ccc' : '#00D084'} />
                <Text style={[styles.hintNavText, currentHint === 0 && styles.hintNavTextDisabled]}>
                  Previous
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.hintNavButton,
                  currentHint === question.hints.length - 1 && styles.hintNavButtonDisabled
                ]}
                onPress={nextHint}
                disabled={currentHint === question.hints.length - 1}
              >
                <Text style={[
                  styles.hintNavText,
                  currentHint === question.hints.length - 1 && styles.hintNavTextDisabled
                ]}>
                  Next
                </Text>
                <Ionicons 
                  name="chevron-forward" 
                  size={16} 
                  color={currentHint === question.hints.length - 1 ? '#ccc' : '#00D084'} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#161616',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#E8F5E8',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  questionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E8F5E8',
    marginRight: 8,
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#E8F5E8',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 4,
  },
  languageSelector: {
    backgroundColor: '#E8F5E8',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
    borderRadius: 16,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  languageButtonActive: {
    backgroundColor: '#00D084',
    borderColor: '#00D084',
  },
  languageText: {
    fontSize: 12,
    color: '#555555',
    marginLeft: 4,
  },
  languageTextActive: {
    color: '#E8F5E8',
  },
  editorContainer: {
    flex: 1,
    backgroundColor: '#E8F5E8',
    margin: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  editorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E8F5E8',
  },
  editorControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fontButton: {
    padding: 4,
  },
  fontSizeText: {
    fontSize: 12,
    color: '#555555',
    marginHorizontal: 8,
  },
  resetButton: {
    padding: 4,
    marginLeft: 8,
  },
  codeScrollView: {
    flex: 1,
  },
  codeInput: {
    flex: 1,
    padding: 12,
    fontFamily: 'Courier New',
    color: '#E8F5E8',
    lineHeight: 20,
    minHeight: 200,
  },
  testCasesContainer: {
    backgroundColor: '#E8F5E8',
    margin: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    maxHeight: 200,
  },
  testCasesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E8F5E8',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  testCasesList: {
    flex: 1,
  },
  testCase: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#161616',
  },
  testCaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  testCaseTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E8F5E8',
  },
  testCaseContent: {
    gap: 4,
  },
  testCaseSection: {
    marginBottom: 4,
  },
  testCaseLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#555555',
    marginBottom: 2,
  },
  testCaseValue: {
    fontSize: 12,
    fontFamily: 'Courier New',
    color: '#E8F5E8',
    backgroundColor: '#161616',
    padding: 4,
    borderRadius: 4,
  },
  actionContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#E8F5E8',
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
    gap: 12,
  },
  runButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00D084',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
    flex: 1,
  },
  runButtonText: {
    color: '#E8F5E8',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00D084',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
    flex: 1,
  },
  submitButtonText: {
    color: '#E8F5E8',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  hintsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  hintsModal: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  hintsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  hintsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E8F5E8',
  },
  hintsCloseButton: {
    padding: 4,
  },
  hintText: {
    fontSize: 14,
    color: '#E8F5E8',
    lineHeight: 20,
    marginBottom: 20,
  },
  hintsNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hintNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  hintNavButtonDisabled: {
    opacity: 0.5,
  },
  hintNavText: {
    fontSize: 14,
    color: '#00D084',
    marginHorizontal: 4,
  },
  hintNavTextDisabled: {
    color: '#ccc',
  },
});


