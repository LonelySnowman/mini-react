import React from 'react';
import ReactDOM from 'react-dom/client';

const jsx = (
	<div>
		<span>mini-react</span>
	</div>
);

function App() {
	return (
		<div>
			<span>mini-react</span>
		</div>
	);
}

ReactDOM.createRoot(document.getElementById('root')!).render(jsx);
