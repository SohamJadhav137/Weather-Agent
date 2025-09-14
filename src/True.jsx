import ChatContainer from "./components/ChatContainer/ChatContainer"
import MessageList from './components/MessageList/MessageList'
import InputContainer from "./components/InputContainer/InputContainer"
import { useState } from "react"

function App() {
  const [value, setValue] = useState('')
  const [messages, setMessages] = useState(
    [
      {
        id: 1,
        role: 'agent',
        content: 'Hello, how can I help ?'
      }
    ]
  )


  const sendMessageHandler = async () => {
    if (value.trim() === '') return

    const userMessage = { id: 122, role: 'user', content: value }
    setMessages([...messages, userMessage])
    setValue('')

    try {
      const apiURL = "https://millions-screeching-vultur.mastra.cloud/api/agents/weatherAgent/stream"

      const response = await fetch(apiURL, {
        method: 'POST',
        headers: {
          'Accept': "*/*",
          'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8,fr;q=0.7',
          'Connection': 'keep-alive',
          'Content-Type': 'application/json',
          'x-mastra-dev-playground': 'true'
        },
        body: JSON.stringify(
          {
            "messages": [
              {
                "role": "user",
                "content": userMessage.content
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
          }
        )
      })

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      let agentResponse = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done)
          break

        agentResponse += decoder.decode(value, { stream: true })

        const agentMessage = { role: 'agent', content: agentResponse }
        setMessages([...messages, agentMessage])
      }
    }
    catch (error) {
      console.error('API error: ', error)
    }
  }
  return (
    <>
      <ChatContainer>
        <MessageList messages={messages} />
        <InputContainer value={value} setValue={setValue} sendMessageHandler={sendMessageHandler} />
      </ChatContainer>
    </>
  )
}

export default App
