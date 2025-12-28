// Chat Service - Handles streaming AI conversations

interface StreamChatParams {
  messages: Array<{ role: string; content: string }>;
  systemPrompt?: string;
  onChunk?: (text: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: string) => void;
}

export const streamChat = async ({
  messages,
  systemPrompt,
  onChunk,
  onComplete,
  onError,
}: StreamChatParams): Promise<void> => {
  try {
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/atlas-chat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          messages,
          systemPrompt,
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    if (reader) {
      // Streaming path
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullText += content;
                onChunk?.(content);
              }
            } catch (e) {
              // Skip invalid JSON chunks
            }
          }
        }
      }
    } else {
      // Fallback for non-streaming
      const text = await response.text();
      fullText = text;
      onChunk?.(text);
    }

    onComplete?.(fullText);
  } catch (error: any) {
    onError?.(error.message || 'Failed to stream chat');
  }
};
