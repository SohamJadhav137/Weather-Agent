import React from 'react'
import './Message.css'

export default function Message(props) {
  const messageRole = props.role === 'user' ? 'message user' : 'message agent'
  return (
    <div className={messageRole}>
      <p>{props.message}</p>
    </div>
  )
}
