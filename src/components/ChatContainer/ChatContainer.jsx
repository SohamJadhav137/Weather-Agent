import React from 'react'

import './ChatContainer.css'

export default function ChatContainer({children}) {
  return (
    <div className='chat-container'>
        {children}
    </div>
  )
}
