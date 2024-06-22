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
	return <div>num大于10</div>;
}

function App() {
	const [num, setNum] = useState(1);
	const arr = [
		<div key="1">1</div>,
		<div key="2">2</div>,
		<div key="3">3</div>,
		<div key="4">4</div>
	];

	const arr2 = [
		<div key="3">3</div>,
		<div key="2">2</div>,
		<div key="1">1</div>
	];
	return (
		<div
			onClick={() => {
				console.log('事件触发');
				setNum(num + 1);
			}}
		>
			{num % 2 === 0 ? arr : arr2}
			{/*{num < 10 ? arr : <Child></Child>}*/}
		</div>
	);
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
