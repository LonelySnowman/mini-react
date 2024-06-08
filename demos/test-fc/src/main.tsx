import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';

// const jsx = (
// 	<div>
// 		<span>mini-react</span>
// 	</div>
// );
//
// ReactDOM.createRoot(document.getElementById('root')).render(jsx);

function Child() {
	return <div>num大于10</div>
}

function App() {
	const [num, setNum] = useState(1);
	return (
		<div onClick={()=>{
			console.log('事件触发');
			setNum(num + 1)
		}}>
			{num < 10 ? num : <Child></Child>}
		</div>
	);
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
