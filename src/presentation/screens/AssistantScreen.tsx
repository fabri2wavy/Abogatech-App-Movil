import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { sendMessageToAI, type AIMessage } from '../../lib/ai';

// ─── Types ───────────────────────────────────────────────────────
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

// ─── Initial message ─────────────────────────────────────────────
const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    role: 'assistant',
    content:
      'Hola Dr. Iturri, soy su asistente legal. ¿Qué concepto o definición necesita consultar hoy?',
  },
];

// ─── AssistantScreen ─────────────────────────────────────────────
export default function AssistantScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  // Keep conversation history in OpenAI format (role: 'user' | 'assistant')
  const aiHistoryRef = useRef<AIMessage[]>([]);

  // ─── Keyboard Listener ─────────────────────────────────────────
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const showSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // ─── Scroll helper ─────────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  // ─── Send message ──────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isTyping) return;

    // 1. Add user message to UI
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);
    scrollToBottom();

    try {
      // 2. Call Groq API with full conversation history
      const reply = await sendMessageToAI(
        aiHistoryRef.current,
        text
      );

      // 3. Update conversation history
      aiHistoryRef.current = [
        ...aiHistoryRef.current,
        { role: 'user', content: text },
        { role: 'assistant', content: reply },
      ];

      // 4. Add assistant reply to UI
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Error al consultar IA:', error);
      
      const isRateLimit = error.message?.includes('muchas consultas');
      const textToDisplay = isRateLimit 
        ? error.message 
        : `Lo siento, la red está saturada. [${error.message || 'Error desconocido'}]`;

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: textToDisplay,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      scrollToBottom();
    }
  }, [inputText, isTyping, scrollToBottom]);

  // ─── Render bubble ─────────────────────────────────────────────
  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';

    return (
      <View
        className={`mb-3 max-w-[82%] ${isUser ? 'self-end' : 'self-start'}`}
      >
        {/* Role label */}
        <Text
          className={`text-xs font-semibold mb-1 ${
            isUser ? 'text-slate-400 text-right' : 'text-blue-600 text-left'
          }`}
        >
          {isUser ? 'Tú' : '⚖️ Asistente Legal'}
        </Text>

        {/* Bubble */}
        <View
          className={`px-4 py-3 ${
            isUser
              ? 'bg-blue-600 rounded-2xl rounded-br-md'
              : 'bg-white border border-slate-200 rounded-2xl rounded-bl-md'
          }`}
        >
          <Text
            className={`text-base leading-6 ${
              isUser ? 'text-white' : 'text-slate-800'
            }`}
          >
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  // ─── Render ────────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View className="px-6 pt-5 pb-3 border-b border-slate-200 bg-white">
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center">
              <Ionicons name="sparkles" size={20} color="#2563EB" />
            </View>
            <View className="ml-3">
              <Text className="text-slate-900 font-bold text-lg">
                Asistente Legal IA
              </Text>
              <Text className="text-emerald-500 text-xs font-semibold">
                ● Llama 3.3 · En línea
              </Text>
            </View>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 8,
          }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
        />

        {/* Typing indicator */}
        {isTyping && (
          <View className="px-6 pb-2 flex-row items-center">
            <ActivityIndicator size="small" color="#2563EB" />
            <Text className="text-slate-400 text-sm ml-2 font-medium">
              Analizando su consulta…
            </Text>
          </View>
        )}

        {/* Input Bar */}
        <View className={`px-4 pt-2 bg-slate-50 ${keyboardVisible ? 'pb-4' : 'pb-[110px]'}`}>
          <View className="flex-row items-end">
            <View className="flex-1 bg-white border border-slate-200 shadow-sm rounded-3xl px-4 py-1 mr-2 min-h-[48px] max-h-[120px] justify-center">
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder="Escriba su consulta legal..."
                placeholderTextColor="#94A3B8"
                multiline
                className="text-base text-slate-900 leading-5 py-2"
                onSubmitEditing={handleSend}
                blurOnSubmit={false}
                editable={!isTyping}
              />
            </View>
            <TouchableOpacity
              onPress={handleSend}
              disabled={!inputText.trim() || isTyping}
              activeOpacity={0.8}
              className={`w-12 h-12 rounded-full items-center justify-center shadow-sm ${
                inputText.trim() && !isTyping ? 'bg-blue-600' : 'bg-slate-200'
              }`}
            >
              <Ionicons
                name="arrow-up"
                size={22}
                color={inputText.trim() && !isTyping ? '#FFFFFF' : '#94A3B8'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
