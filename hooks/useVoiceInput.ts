import { useState } from 'react';
import { Platform } from 'react-native';

export const useVoiceInput = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');

  const startRecording = async () => {
    setIsRecording(true);
    
    // Simulate voice recording for demo
    // In production: integrate expo-speech-recognition or Web Speech API
    setTimeout(() => {
      // Mock transcription after 3 seconds
      setTranscript('I want to go to Tokyo in March');
    }, 3000);
  };

  const stopRecording = async () => {
    setIsRecording(false);
  };

  const clearTranscript = () => {
    setTranscript('');
  };

  return {
    isRecording,
    transcript,
    startRecording,
    stopRecording,
    clearTranscript,
  };
};
