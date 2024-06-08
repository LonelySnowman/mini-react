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
	return <div>num 小于10</div>
}

function App() {
	const [num, setNum] = useState(1000);
	window.setNum = setNum;
	return (
		<div>
			{num > 10 ? num : <Child></Child>}
		</div>
	);
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
