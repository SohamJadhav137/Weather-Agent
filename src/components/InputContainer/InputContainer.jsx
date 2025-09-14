import React from 'react'

import './InputContainer.css'

export default function InputContainer(props) {
  const OnEnterHandler = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      props.sendMessageHandler()
    }
  }
  return (
    <div className='input-container'>
      <textarea type='text'
        onChange={(e) => props.setValue(e.target.value)}
        onKeyDown={OnEnterHandler}
        value={props.value} />
      <div className="button-container">
        <button onClick={props.sendMessageHandler} disabled={props.loading}/>
      </div>
    </div>
  )
}
