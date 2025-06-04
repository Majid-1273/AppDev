// AI-Powered Chatbot Screen Component with Claude API
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Dimensions } from 'react-native';
import Config from 'react-native-config';


const Chatbot = () => {
  const { width, height } = Dimensions.get('window');
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm PetBot, your AI assistant for pet care. How can I help you today?",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef();

  // Replace with your Claude API key
  const CLAUDE_API_KEY = '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';
  const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

const generateBotResponse = async (userMessage) => {
  try {
    // console.log('Making API request to Claude...');
    // console.log('API Key available:', CLAUDE_API_KEY ? 'Yes' : 'No');
    
    // Check if API key is available
    if (!CLAUDE_API_KEY) {
      console.warn('No API key found, using fallback response');
      return getLocalResponse(userMessage);
    }
    
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022', // Updated model
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: `You are PetBot, a helpful AI assistant specializing in pet care advice. 
                      You provide helpful, accurate information about pet health, behavior, nutrition, and general care.
                      Always recommend consulting with a veterinarian for serious health concerns.
                      Keep responses concise but informative. Be friendly and supportive.
                      
                      User question: ${userMessage}`
          }
        ]
      })
    });

    // console.log('Response status:', response.status);
    // console.log('Response ok:', response.ok);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Claude API Error:', errorData);
      
      if (response.status === 401) {
        console.error('Authentication failed - check API key');
      } else if (response.status === 429) {
        console.error('Rate limit exceeded');
      }
      
      // Fall back to local response
      return getLocalResponse(userMessage);
    }

    const data = await response.json();
    // console.log('Claude API Response received');
    
    if (data.content && data.content[0] && data.content[0].text) {
      return data.content[0].text.trim();
    } else {
      console.error('Unexpected response structure:', data);
      return getLocalResponse(userMessage);
    }
  } catch (error) {
    console.error('Network or parsing error:', error.message);
    
    // Always fall back to local response on any error
    return getLocalResponse(userMessage);
  }
};

  // Enhanced fallback local responses when API is unavailable
  const getLocalResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('eating') || lowerMessage.includes('food') || lowerMessage.includes('appetite')) {
      return "Loss of appetite can be concerning. Check if your pet is drinking water and monitor for other symptoms. If it persists for more than 24-48 hours, please consult a veterinarian.";
    }
    
    if (lowerMessage.includes('sick') || lowerMessage.includes('ill') || lowerMessage.includes('vomit')) {
      return "If your pet is showing signs of illness, it's best to consult with a veterinarian. Monitor their symptoms and keep them comfortable in the meantime.";
    }
    
    if (lowerMessage.includes('behavior') || lowerMessage.includes('training')) {
      return "Pet behavior can be influenced by many factors including health, environment, and training. Consistent positive reinforcement often works well. What specific behavior are you concerned about?";
    }
    
    if (lowerMessage.includes('vaccine') || lowerMessage.includes('vaccination')) {
      return "Vaccinations are crucial for your pet's health. Follow your veterinarian's recommended vaccination schedule. Puppies and kittens typically need a series of vaccines starting at 6-8 weeks.";
    }
    
    if (lowerMessage.includes('exercise') || lowerMessage.includes('walk') || lowerMessage.includes('play')) {
      return "Regular exercise is important for your pet's physical and mental health. Dogs typically need 30 minutes to 2 hours daily, while cats benefit from interactive play sessions. Adjust based on your pet's age and breed.";
    }
    
    if (lowerMessage.includes('grooming') || lowerMessage.includes('brush') || lowerMessage.includes('bath')) {
      return "Regular grooming helps keep your pet healthy and comfortable. Brush regularly to prevent matting, and bathe as needed. Some pets may need professional grooming every 4-8 weeks.";
    }
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return "Hello! I'm here to help with any questions about your pet. What would you like to know?";
    }
    
    if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
      return "You're welcome! I'm always here to help with your pet care questions. Is there anything else you'd like to know?";
    }
    
    return "I understand you're asking about pet care. While I try to help, I recommend consulting with a veterinarian for specific health concerns. Is there anything else I can help you with?";
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputText.trim(),
      isBot: false,
      timestamp: new Date()
    };

    // Add user message
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Get AI response from Claude
      const botResponseText = await generateBotResponse(userMessage.text);
      
      const botMessage = {
        id: Date.now() + 1,
        text: botResponseText,
        isBot: true,
        timestamp: new Date()
      };

      // Add bot response
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error getting bot response:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        text: "I'm sorry, I'm having trouble responding right now. Please try again later.",
        isBot: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    Alert.alert(
      "Clear Chat",
      "Are you sure you want to clear all messages?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear", 
          style: "destructive",
          onPress: () => {
            setMessages([
              {
                id: 1,
                text: "Hello! I'm PetBot, your AI assistant for pet care. How can I help you today?",
                isBot: true,
                timestamp: new Date()
              }
            ]);
          }
        }
      ]
    );
  };

  const renderMessage = (message) => (
    <View 
      key={message.id} 
      style={message.isBot ? styles.botMessage : styles.userMessage}
    >
      <Text style={message.isBot ? styles.messageText : styles.userMessageText}>
        {message.text}
      </Text>
      <Text style={message.isBot ? styles.messageTime : styles.userMessageTime}>
        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={styles.screenTitle}>🐾 PetBot Assistant</Text>
        <TouchableOpacity onPress={clearChat} style={styles.clearButton}>
          <Ionicons name="refresh" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.chatContainer}>
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(renderMessage)}
          
          {isLoading && (
            <View style={styles.loadingMessage}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>PetBot is thinking...</Text>
            </View>
          )}
        </ScrollView>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask me about your pet..."
            multiline
            maxLength={500}
            editable={!isLoading}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity 
            style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="send" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default Chatbot;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    paddingTop:40
  },
  
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  
  clearButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  
  chatContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  
  messageList: {
    flex: 1,
    paddingHorizontal: 15,
  },
  
  messageListContent: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 20,
    borderTopLeftRadius: 5,
    marginBottom: 10,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 20,
    borderTopRightRadius: 5,
    marginBottom: 10,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#2c3e50',
  },
  
  userMessageText: {
    fontSize: 16,
    lineHeight: 22,
    color: 'white',
  },
  
  messageTime: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  
  userMessageTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  
  loadingMessage: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 20,
    borderTopLeftRadius: 5,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  
  loadingText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 10,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: '#f8f9fa',
  },
  
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  
  sendButtonDisabled: {
    backgroundColor: '#adb5bd',
    shadowOpacity: 0,
    elevation: 0,
  },
});