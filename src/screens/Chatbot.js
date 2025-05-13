// Chatbot Screen Component
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import styles from '../../styles';

const Chatbot = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>PetBot Assistant</Text>
      
      <View style={styles.chatContainer}>
        <ScrollView style={styles.messageList}>
          <View style={styles.botMessage}>
            <Text style={styles.messageText}>Hello! How can I help with your pet today?</Text>
          </View>
          
          <View style={styles.userMessage}>
            <Text style={styles.messageText}>My dog isn't eating well</Text>
          </View>
          
          <View style={styles.botMessage}>
            <Text style={styles.messageText}>I'm sorry to hear that. How long has this been going on? Has there been any change in their routine?</Text>
          </View>
          
          <View style={styles.userMessage}>
            <Text style={styles.messageText}>About 2 days now</Text>
          </View>
          
          <View style={styles.botMessage}>
            <Text style={styles.messageText}>If your dog hasn't eaten for 2 days, I recommend speaking with a veterinarian. Would you like me to help you find a vet nearby?</Text>
          </View>
        </ScrollView>
        
        <View style={styles.inputContainer}>
          <View style={styles.textInput}>
            <Text>Type your message...</Text>
          </View>
          <TouchableOpacity style={styles.sendButton}>
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default Chatbot;
