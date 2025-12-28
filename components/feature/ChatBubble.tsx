import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { ChatMessage } from '../../types';

interface ChatBubbleProps {
  message: ChatMessage;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.container, isUser && styles.containerUser]}>
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleAssistant,
        ]}
      >
        <Text style={[styles.text, isUser && styles.textUser]}>
          {message.content}
        </Text>
        <Text style={styles.timestamp}>
          {new Date(message.created_at || '').toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
    alignItems: 'flex-start',
  },
  
  containerUser: {
    alignItems: 'flex-end',
  },
  
  bubble: {
    maxWidth: '80%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  
  bubbleAssistant: {
    backgroundColor: Colors.surface.raised,
    borderBottomLeftRadius: Spacing.xs,
    ...Shadows.sm,
  },
  
  bubbleUser: {
    backgroundColor: Colors.primary.main,
    borderBottomRightRadius: Spacing.xs,
    ...Shadows.sm,
  },
  
  text: {
    fontSize: Typography.sizes.base,
    color: Colors.text.primary,
    lineHeight: Typography.sizes.base * 1.5,
  },
  
  textUser: {
    color: Colors.text.primary,
  },
  
  timestamp: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
    opacity: 0.7,
  },
});
