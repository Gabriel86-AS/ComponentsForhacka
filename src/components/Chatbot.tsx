import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Bot, User, Send, Square, RotateCcw, MessageSquare } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InputExcel } from "@/components/excel/InputExcel";
import { useExcelStore } from "@/store/excel.store";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */
export interface ChatbotProps {
  /** API endpoint for the chat backend. Defaults to "/api/chat". */
  readonly apiEndpoint?: string;
  /** Claude model id to use. Defaults to "claude-haiku-4-5". */
  readonly model?: string;
  /** System prompt sent with every request. */
  readonly system?: string;
  /** Placeholder text for the input field. */
  readonly placeholder?: string;
  /** Title displayed in the card header. */
  readonly title?: string;
  /** Additional CSS class names for the root card. */
  readonly className?: string;
  /** Initial messages to seed the conversation. */
  readonly initialMessages?: UIMessage[];
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export function Chatbot(props: Readonly<ChatbotProps>) {
  const {
    apiEndpoint = "/api/chat",
    model,
    system,
    placeholder = "Type a message…",
    title = "Chat with Claude",
    className,
    initialMessages,
  } = props;
  /* ---- local input state (v5 useChat no longer manages input) ---- */
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const clearExcelData = useExcelStore((state) => state.clearExcelData);
  const hasFile = useExcelStore((state) => state.hasFile);
  const excelData = useExcelStore((state) => state.data);

  /* ---- useChat (AI SDK v5 / @ai-sdk/react v2) ---- */
  const { messages, sendMessage, status, error, stop, regenerate } = useChat({
    transport: new DefaultChatTransport({
      api: apiEndpoint,
      body: { model, system },
    }),
    messages: initialMessages,
    onFinish: ({ isAbort, isError }) => {
      if (!isAbort && !isError) {
        clearExcelData();
      }
    },
  });

  const isLoading = status === "submitted" || status === "streaming";

  /* ---- auto-scroll ---- */
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, status]);

  /* ---- auto-resize textarea ---- */
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${Math.min(ta.scrollHeight, 88)}px`;
    }
  }, [input]);

  /* ---- submit handler ---- */
  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    sendMessage(
      { text: trimmed },
      hasFile ? { body: { model, system, excelData } } : { body: { model, system } }
    );
    setInput("");
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [excelData, hasFile, input, isLoading, model, sendMessage, system]);

  /* ---- keyboard (Enter to send, Shift+Enter for newline) ---- */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  /* ---- render helpers ---- */
  const renderMessageContent = (message: UIMessage) => {
    // Walk message.parts (AI SDK v5 message-parts model)
    if (message.parts && message.parts.length > 0) {
      const text = message.parts
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("");

      return <span className="whitespace-pre-wrap break-words">{text}</span>;
    }
    return null;
  };

  return (
    <Card
      className={cn(
        "flex flex-col w-full max-w-[480px] h-[640px] shadow-xl border-border/50 backdrop-blur-sm",
        className
      )}
      id="chatbot-card"
    >
      {/* ---- Header ---- */}
      <CardHeader className="border-b border-border/50 pb-4 flex-shrink-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
            <Bot className="w-4 h-4" />
          </div>
          {title}
        </CardTitle>
      </CardHeader>

      {/* ---- Messages ---- */}
      <CardContent className="flex-1 overflow-hidden p-0">
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto px-6 py-4 space-y-4 scroll-smooth"
          id="chatbot-messages"
        >
          {/* Empty state */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3 animate-fade-in">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/10 to-indigo-600/10 flex items-center justify-center">
                <MessageSquare className="w-7 h-7 text-violet-500" />
              </div>
              <p className="text-sm font-medium">Inicia una conversacion</p>
              <p className="text-xs text-center max-w-[240px]">
                Envia un mensaje para iniciar una conversacion con el agente de IA.
              </p>
            </div>
          )}

          {/* Message bubbles */}
          {messages.map((message) => {
            const isUser = message.role === "user";
            return (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 animate-fade-in",
                  isUser ? "flex-row-reverse" : "flex-row"
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white mt-0.5",
                    isUser
                      ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                      : "bg-gradient-to-br from-violet-500 to-indigo-600"
                  )}
                >
                  {isUser ? (
                    <User className="w-3.5 h-3.5" />
                  ) : (
                    <Bot className="w-3.5 h-3.5" />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    isUser
                      ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  )}
                >
                  {renderMessageContent(message)}
                </div>
              </div>
            );
          })}

          {/* Thinking indicator */}
          {status === "submitted" && (
            <div className="flex gap-3 animate-fade-in">
              <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white bg-gradient-to-br from-violet-500 to-indigo-600 mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 flex gap-1.5 items-center">
                <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-pulse-dot" />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-pulse-dot [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-pulse-dot [animation-delay:0.4s]" />
              </div>
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-fade-in">
              <p className="font-medium">Something went wrong</p>
              <p className="text-xs text-destructive/80">{error.message}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => regenerate()}
                className="mt-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                id="chatbot-retry-btn"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                Retry
              </Button>
            </div>
          )}
        </div>
      </CardContent>

      {/* ---- Footer / Input ---- */}
      <CardFooter className="border-t border-border/50 p-3 flex-shrink-0">
        <div className="flex w-full items-end gap-2">
          <div className="flex-shrink-0">
            <InputExcel />
          </div>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading && status !== "streaming"}
            rows={1}
            className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-1.5 text-sm leading-5 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[40px] max-h-[88px] scrollbar-thin"
            id="chatbot-input"
          />

          {isLoading ? (
            <Button
              variant="outline"
              size="icon"
              onClick={() => stop()}
              className="flex-shrink-0 h-10 w-10 rounded-lg border-destructive/30 text-destructive hover:bg-destructive/10"
              id="chatbot-stop-btn"
            >
              <Square className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              size="icon"
              onClick={handleSubmit}
              disabled={!input.trim()}
              className="flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white shadow-md transition-all hover:shadow-lg disabled:opacity-40 disabled:shadow-none"
              id="chatbot-send-btn"
            >
              <Send className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

export default Chatbot;
