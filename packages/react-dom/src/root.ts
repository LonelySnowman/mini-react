import { Container } from 'hostConfig';
import {
	createContainer,
	updateContainer
} from 'react-reconciler/src/ReactFiberReconciler';
import { ReactElementType } from 'shared/ReactTypes';
import { initEvent } from './SyntheticEvents';

/**
 * @default createRoot 与 Render 最开始渲染的地方
 * @param container
 */
export function createRoot(container: Container) {
	const root = createContainer(container);
	return {
		render(element: ReactElementType) {
			// 初始化 click 事件
			initEvent(container, 'click');
			return updateContainer(element, root);
		}
	};
}
