import React from 'react';
import ReactDOM from 'react-dom/client';

const jsx = (
    <div>
        <span>mini-react</span>
    </div>
)

const root = document.querySelector('#root')

console.log(root)

ReactDOM.createRoot(root).render(jsx)

console.log(React)
console.log(jsx)
console.log(ReactDOM)
