import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';

// const jsx = (
// 	<div>
// 		<span>mini-react</span>
// 	</div>
// );
//
// ReactDOM.createRoot(document.getElementById('root')).render(jsx);

function App() {
	const [num] = useState(1000);
	return (
		<div>
			<span>{num}</span>
		</div>
	);
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
