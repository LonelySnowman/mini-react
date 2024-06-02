import { ReactElementType } from 'shared/ReactTypes';
import { createRoot } from './src/root';

export function renderIntoDocument(element: ReactElementType) {
	const div = document.createElement('div');
	// element
	return createRoot(div).render(element);
}
