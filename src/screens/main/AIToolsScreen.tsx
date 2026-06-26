import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Dimensions,
  useWindowDimensions,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useChat from '../../hooks/useChat';
import { User } from '../../types';

interface AIToolsScreenProps {
  user: User;
}

const { width } = Dimensions.get('window');
const IS_MOBILE = width < 900;

export default function AIToolsScreen({ user }: AIToolsScreenProps) {
  const insets = useSafeAreaInsets();
  const {
    messages,
    input,
    loading,
    handleSend,
    clearChat,
    setInput,
  } = useChat();
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (scrollViewRef.current && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const quickSuggestions = [
    { icon: 'image-outline' as const, label: 'Generate an image', color: '#8B5CF6' },
    { icon: 'code-slash-outline' as const, label: 'Write some code', color: '#F59E0B' },
    { icon: 'document-text-outline' as const, label: 'Create content', color: '#00D084' },
    { icon: 'analytics-outline' as const, label: 'Analyze data', color: '#3B82F6' },
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0B" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Tutor</Text>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={clearChat}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={20} color="#5C6782" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={[
            styles.messagesContent,
            messages.length === 0 && styles.messagesContentEmpty
          ]}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="sparkles" size={48} color="#00D084" />
              </View>
              <Text style={styles.emptyTitle}>What can I help you create?</Text>
              <Text style={styles.emptySubtitle}>
                Ask me anything, from writing code to explaining concepts!
              </Text>
              
              <View style={[styles.suggestionsGrid, IS_MOBILE && styles.suggestionsGridMobile]}>
                {quickSuggestions.map((s, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.suggestionCard, IS_MOBILE && styles.suggestionCardMobile]}
                    activeOpacity={0.75}
                    onPress={() => setInput(s.label)}
                  >
                    <View style={[styles.suggestionIconBox, { backgroundColor: s.color + '18' }]}> 
                      <Ionicons name={s.icon} size={20} color={s.color} />
                    </View>
                    <Text style={styles.suggestionText}>{s.label}</Text>
                    <Ionicons name="arrow-forward" size={14} color="#4F5B78" style={{ marginLeft: 'auto' }} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.messagesList}>
              {messages.map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.messageBubble,
                    msg.role === 'user' ? styles.userBubble : styles.assistantBubble
                  ]}
                >
                  {msg.role === 'assistant' && (
                    <View style={styles.assistantAvatar}>
                      <Ionicons name="sparkles" size={16} color="#00D084" />
                    </View>
                  )}
                  <Text
                    style={[
                      styles.messageText,
                      msg.role === 'user' ? styles.userText : styles.assistantText
                    ]}
                  >
                    {msg.content}
                  </Text>
                </View>
              ))}
              {loading && (
                <View style={styles.loadingBubble}>
                  <ActivityIndicator color="#00D084" size="small" />
                  <Text style={styles.loadingText}>Thinking...</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 16 }]}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Message AI Tutor..."
            placeholderTextColor="#5C6782"
            multiline
            editable={!loading}
            onSubmitEditing={() => input.trim() && handleSend()}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!input.trim() || loading) && styles.sendButtonDisabled]}
            onPress={() => input.trim() && handleSend()}
            disabled={!input.trim() || loading}
          >
            <Ionicons name="send" size={20} color="#080B11" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0B0B0B',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },

  headerTitle: {
    color: '#E8EEF9',
    fontSize: 18,
    fontWeight: '700',
  },

  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  messagesContainer: {
    flex: 1,
  },

  messagesContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },

  messagesContentEmpty: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyState: {
    alignItems: 'center',
    maxWidth: 600,
    width: '100%',
  },

  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 208, 132, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 132, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },

  emptyTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#E8EEF9',
    marginBottom: 12,
    textAlign: 'center',
  },

  emptySubtitle: {
    fontSize: 15,
    color: '#5C6782',
    textAlign: 'center',
    marginBottom: 32,
  },

  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    width: '100%',
    maxWidth: 700,
  },

  suggestionsGridMobile: {
    flexDirection: 'column',
  },

  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161616',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1D2740',
    padding: 16,
    flex: 1,
    minWidth: 280,
  },

  suggestionCardMobile: {
    minWidth: '100%',
  },

  suggestionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  suggestionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#C0CAE0',
  },

  messagesList: {
    flexDirection: 'column',
    gap: 20,
  },

  messageBubble: {
    flexDirection: 'row',
    maxWidth: '85%',
    alignItems: 'flex-start',
  },

  userBubble: {
    alignSelf: 'flex-end',
  },

  assistantBubble: {
    alignSelf: 'flex-start',
  },

  assistantAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 208, 132, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 132, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },

  messageText: {
    fontSize: 15,
    lineHeight: 24,
  },

  userText: {
    color: '#F8FAFC',
    backgroundColor: '#1E1E1E',
    padding: 14,
    borderRadius: 18,
    borderBottomRightRadius: 4,
  },

  assistantText: {
    color: '#CCCCCC',
    backgroundColor: 'transparent',
  },

  loadingBubble: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
  },

  loadingText: {
    color: '#5C6782',
    fontSize: 14,
  },

  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#0B0B0B',
  },

  input: {
    flex: 1,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#1D2740',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#E8EEF9',
    marginRight: 12,
    maxHeight: 120,
  },

  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#00D084',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sendButtonDisabled: {
    opacity: 0.3,
  },
});
