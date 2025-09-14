import ChatContainer from "./components/ChatContainer/ChatContainer"
import MessageList from './components/MessageList/MessageList'
import InputContainer from "./components/InputContainer/InputContainer"
import './App.css'

import { useEffect, useRef, useState } from "react"

function App() {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false)
  const [isPanelOpen, setIsPanelOpen] = useState(window.innerWidth >= 1024)
  const [openDropdown, setOpenDropdown] = useState(null)

  // Side panel toggle
  const togglePanel = () => {
    setIsPanelOpen(open => !open)
  }

  const clearChat = (threadId) => {
    setThreads(threads => threads.map(thread => thread.id === threadId ? { ...thread, messages: [{ id: Date.now(), role: 'agent', message: 'Hi, how can I help you ?' }] } : thread))
    setOpenDropdown(null)
  }

  const [threads, setThreads] = useState([
    {
      id: 1,
      title: "Chat 1",
      messages: [
        { id: 1, role: 'agent', message: 'Hi, how can I help you ?' }
      ]
    }
  ]
  )

  const [activeThread, setActiveThread] = useState(1)

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages update
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [threads, activeThread]);

  useEffect(() => {
    // Handle responsiveness of website
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsPanelOpen(true);
      } else {
        setIsPanelOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Parsing incoming chunks of data 
  const processStreamChunk = (chunk) => {
    // Split the chunk into individual parts
    const parts = chunk.split(/(?=[f90aed]:)/);

    let result = {
      text: '',
      toolCalls: [],
      metadata: {}
    };

    for (const part of parts) {
      if (!part.trim()) continue;

      const [prefix, ...contentParts] = part.split(':');
      const content = contentParts.join(':').trim();

      if (!content) continue;

      try {
        // Handle JSON content
        if (['f', '9', 'a', 'e', 'd'].includes(prefix)) {
          const data = JSON.parse(content);

          switch (prefix) {
            case 'f':
              result.metadata.messageId = data.messageId;
              break;
            case '9':
              result.toolCalls.push({ type: 'request', ...data });
              break;
            case 'a':
              result.toolCalls.push({ type: 'result', ...data });
              break;
            case 'e':
            case 'd':
              result.metadata = { ...result.metadata, ...data };
              break;
          }
        }
        // Handle text content (prefix '0')
        else if (prefix === '0') {
          // Remove quotes from text content
          const text = content.replace(/^"|"$/g, '');
          result.text += text;
        }
      } catch (e) {
        console.warn('Failed to parse chunk:', part, e);
      }
    }

    return result;
  };

  const sendMessageHandler = async () => {
    if (value.trim() === '') return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      message: value
    };
    setThreads(prevThreads => prevThreads.map(thread => thread.id === activeThread ? { ...thread, messages: [...thread.messages, userMessage] } : thread))

    setLoading(true)
    setValue('');

    // Add a temporary agent message that will be updated as we stream
    const tempAgentMessage = {
      id: Date.now() + 1,
      role: 'agent',
      message: 'Typing...',
      isStreaming: true
    };

    setThreads(prevThreads => prevThreads.map(thread => thread.id === activeThread ? { ...thread, messages: [...thread.messages, tempAgentMessage] } : thread))

    try {
      const apiURL = "https://millions-screeching-vultur.mastra.cloud/api/agents/weatherAgent/stream";

      const response = await fetch(apiURL, {
        method: 'POST',
        headers: {
          'Accept': "*/*",
          'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8,fr;q=0.7',
          'Connection': 'keep-alive',
          'Content-Type': 'application/json',
          'x-mastra-dev-playground': 'true'
        },
        body: JSON.stringify({
          "messages": [
            {
              "role": "user",
              "content": userMessage.message
            }
          ],
          "runId": "weatherAgent",
          "maxRetries": 2,
          "maxSteps": 5,
          "temperature": 0.5,
          "topP": 1,
          "runtimeContext": {},
          "threadId": 2,
          "resourceId": "weatherAgent"
        })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const processed = processStreamChunk(chunk);

        if (processed.text) {
          accumulatedContent += processed.text;

          setThreads(prev =>
            prev.map(t =>
              t.id === activeThread
                ? {
                  ...t,
                  messages: t.messages.map(msg =>
                    msg.id === tempAgentMessage.id
                      ? { ...msg, message: accumulatedContent }
                      : msg
                  )
                }
                : t
            )
          );
        }
      }

      setThreads(prev =>
        prev.map(t =>
          t.id === activeThread
            ? {
              ...t,
              messages: t.messages.map(msg =>
                msg.id === tempAgentMessage.id
                  ? { ...msg, isStreaming: false }
                  : msg
              )
            }
            : t
        )
      );
    } catch (error) {
      console.error('API error: ', error);

      setThreads(prev =>
        prev.map(t =>
          t.id === activeThreadId
            ? {
              ...t,
              messages: t.messages.map(msg =>
                msg.id === tempAgentMessage.id
                  ? { ...msg, message: "Sorry, there was an error.", isStreaming: false }
                  : msg
              )
            }
            : t
        )
      );
    }
    finally {
      setLoading(false)
    }
  };
  return (
    <>
      <div className="app-container">
        <div className={`side-panel-container ${isPanelOpen ? 'open' : 'close'}`}>
          <div className="side-panel">
            <h3>Weather Chat</h3>
            <button onClick={() => {
              const newId = Date.now()
              setThreads([...threads, { id: newId, title: `Chat ${threads.length + 1}`, messages: [{ id: Date.now(), role: 'agent', message: 'Hi, how can I help you ?' }] }])
              setActiveThread(newId)
            }}>
              + New Chat
            </button>
            {
              threads.map(thread => (
                <div key={thread.id} className={thread.id === activeThread ? 'thread active' : 'thread'} onClick={() => {
                  setActiveThread(thread.id)
                  if (window.innerWidth < 1024) {
                    setIsPanelOpen(false)
                  }
                }}>
                  {thread.title}
                  <button className="chat-option-button" onClick={(e) => {
                    e.stopPropagation() // To prevent thread selection
                    setOpenDropdown(openDropdown === thread.id ? null : thread.id)
                  }}>
                    <i class="fa-solid fa-ellipsis-vertical"></i>
                  </button>
                  {
                    openDropdown === thread.id && (
                      <div className="chat-option">
                        <button onClick={() => clearChat(thread.id)}>Clear Chat</button>
                      </div>
                    )
                  }
                </div>
              ))
            }
          </div>
        </div>
        <button className="toggle-button" onClick={togglePanel}>
          {isPanelOpen ? '✕ Close' : '☰ Menu'}
        </button>
        <ChatContainer>
          <MessageList messages={threads.find(t => t.id === activeThread)?.messages || []} />
          <InputContainer value={value} setValue={setValue} sendMessageHandler={sendMessageHandler} loading={loading} />
        </ChatContainer>
      </div>
    </>
  )
}

export default App
