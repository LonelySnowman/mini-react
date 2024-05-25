import { createFiberFromElement, FiberNode } from './ReactFiber';
import { ReactElementType } from 'shared/ReactTypes';
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import { HostText } from './ReactWorkTags';
import { Placement } from './ReactFiberFlags';

// LJQFLAG 构建 Fiber 树并标记副作用

// shouldTrackEffects 是否追踪副作用
// true 追踪副作用 更新时调用
// false 不追踪副作用 初次挂载时调用
export function ChildReconcile(shouldTrackEffects: boolean) {
	// 构建 ReactElement 的 Fiber
	function reconcileSingleElement(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null, // 这个是干嘛的
		element: ReactElementType
	) {
		const fiber = createFiberFromElement(element);
		fiber.return = returnFiber;
		return fiber;
	}

	// 构建 Text 节点的 Fiber
	function reconcileSingleTextNode(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null, // 这个时干嘛的
		content: string | number
	) {
		const fiber = new FiberNode(HostText, { content }, null);
		fiber.return = returnFiber;
		return fiber;
	}

	// 标记更新副作用
	function placeSingleChild(fiber: FiberNode) {
		// 首屏渲染且需要副作用渲染标记 Placement
		if (shouldTrackEffects && fiber.alternate === null) {
			fiber.flags |= Placement;
		}
		return fiber;
	}

	return function reconcileChildFibers(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		newChild?: ReactElementType | string | number
	) {
		if (typeof newChild === 'object' && newChild !== null) {
			switch (newChild.$$typeof) {
				case REACT_ELEMENT_TYPE:
					return placeSingleChild(
						reconcileSingleElement(returnFiber, currentFiber, newChild)
					);
				default:
					if (__DEV__) console.warn('未实现的reconcile类型', newChild);
					break;
			}
		}
		// TODO 多节点情况 ul>li*3

		// HostText
		if (typeof newChild === 'string' || typeof newChild === 'number') {
			return placeSingleChild(
				reconcileSingleTextNode(returnFiber, currentFiber, newChild)
			);
		}

		if (__DEV__) console.warn('该节点不支持');
		return null;
	};
}

export const reconcileChildFibers = ChildReconcile(true);
export const mountChildFibers = ChildReconcile(false);
