import React, { useEffect, useRef } from 'react'

import './MessageList.css'
import Message from '../Message/Message'

export default function MessageList({ messages}) {

  // Handling actual scroll behaviour
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className='message-list'>
      {
        messages.map((msg) => (
          <Message key={msg.id} role={msg.role} message={msg.message} />
        ))
      }
      <div ref={endRef} />
    </div>
  )
}
