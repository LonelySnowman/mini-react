import { FiberNode } from 'react-reconciler/src/ReactFiber';
import { HostComponent, HostText } from 'react-reconciler/src/ReactWorkTags';
import { updateFiberProps } from './SyntheticEvents';
import { Props } from 'shared/ReactTypes';

export type Container = Element;
export type Instance = Element;
export type TextInstance = Text;

export const createInstance = (type: string, props: Props): Instance => {
	// TODO 处理 props
	const element = document.createElement(type);
	updateFiberProps(element, props); // 在 DOM 上存储 Fiber Props
	return element;
};

export const appendInitialChild = (
	parent: Instance | Container,
	child: Instance
) => {
	parent.appendChild(child);
};

export const createTextInstance = (content: string) => {
	return document.createTextNode(content);
};

export const appendChildToContainer = appendInitialChild;

export function commitUpdate(fiber: FiberNode) {
	switch (fiber.tag) {
		case HostText:
			const text = fiber.memoizedProps.content;
			return commitTextUpdate(fiber.stateNode, text);
		case HostComponent:
		// updateFiberProps
		default:
			if (__DEV__) {
				console.warn('未实现的 Update 类型');
			}
			break;
	}
}

export function removeChild(
	child: Instance | TextInstance,
	container: Container
) {
	container.removeChild(child);
}

export function commitTextUpdate(textInstance: TextInstance, content: string) {
	textInstance.textContent = content;
}

export function insertChildToContainer(
	child: Instance,
	container: Container,
	before: Instance
) {
	container.insertBefore(child, before);
}
