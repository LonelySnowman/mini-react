import { Container } from 'hostConfig';
import {
	createContainer,
	updateContainer
} from 'react-reconciler/src/ReactFiberReconciler';
import { ReactElementType } from 'shared/ReactTypes';

/**
 * @default createRoot 与 Render 最开始渲染的地方
 * @param container
 */
export function createRoot(container: Container) {
	const root = createContainer(container);
	return {
		render(element: ReactElementType) {
			updateContainer(element, root);
		}
	};
}
