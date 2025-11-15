'use client';

import { AIInput, AIInputSubmit, AIInputTextarea, AIInputToolbar, AIInputTools } from '@/components/ui/kibo-ui/ai/input';
import { AIMessage, AIMessageContent } from '@/components/ui/kibo-ui/ai/message';
import { AIResponse } from '@/components/ui/kibo-ui/ai/response';
import { useChat } from '@ai-sdk/react';
import { SendIcon } from 'lucide-react';

export default function Page() {
  const { messages, input, handleInputChange, handleSubmit, error, isLoading } = useChat({
    api: '/api/chat',
    onError: (error) => {
      console.error('Chat error:', error);
    },
  });

  return (
    <>

      <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">

        {/* Main Content */}
        <div className="flex flex-col flex-1 h-full overflow-hidden">

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {messages.length === 0 && (
              <div className="p-6 m-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  🤖 AI Chatbot with Tool Calling
                </h3>
                <p className="text-blue-800 dark:text-blue-200 text-sm mb-2">
                  This chatbot can use tools to enhance its responses:
                </p>
                <ul className="text-blue-700 dark:text-blue-300 text-sm list-disc list-inside space-y-1">
                  <li><strong>Calculator:</strong> Ask math questions like "What's 15 * 23?"</li>
                  <li><strong>Date/Time:</strong> Ask "What time is it?" or "What's today's date?"</li>
                  <li><strong>Session Stats:</strong> Ask "How many messages have we exchanged?"</li>
                </ul>
                <p className="text-blue-600 dark:text-blue-400 text-xs mt-3">
                  The AI will automatically use the appropriate tools when needed.
                </p>
              </div>
            )}
            {messages.map(message => (
              <div key={message.id}>
                <AIMessage from={message.role === 'user' ? 'user' : 'assistant'}>
                  <AIMessageContent>
                    <AIResponse>{message.content}</AIResponse>
                  </AIMessageContent>
                </AIMessage>
              </div>
            ))}
            {error && (
              <div className="p-4 m-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded">
                <p className="font-semibold">Error:</p>
                <p>{error.message || 'An error occurred while processing your request. Make sure Workers AI is configured correctly.'}</p>
              </div>
            )}
            {isLoading && (
              <div className="p-4 m-4 text-gray-500 dark:text-gray-400">
                Processing...
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t dark:border-gray-700">
            <AIInput onSubmit={handleSubmit}>
              <AIInputTextarea value={input} onChange={handleInputChange} />
              <AIInputToolbar>
                <AIInputTools>
                </AIInputTools>
                <AIInputSubmit>
                  <SendIcon size={16} />
                </AIInputSubmit>
              </AIInputToolbar>
            </AIInput>
          </div>
        </div>
      </div>
    </>
  );
}