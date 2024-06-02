import {
	createFiberFromElement,
	createWorkInProgress,
	FiberNode
} from './ReactFiber';
import { Props, ReactElementType } from 'shared/ReactTypes';
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import { HostText } from './ReactWorkTags';
import { ChildDeletion, Placement } from './ReactFiberFlags';

// 构建 Fiber 树并标记副作用
// shouldTrackEffects 是否追踪副作用
// true 追踪副作用 更新时调用
// false 不追踪副作用 初次挂载时调用
export function ChildReconcile(shouldTrackEffects: boolean) {
	function deleteChild(returnFiber: FiberNode, childToDelete: FiberNode) {
		if (!shouldTrackEffects) return;
		const deletions = returnFiber.deletions;
		if (deletions === null) {
			returnFiber.deletions = [childToDelete]; // 添加要删除的节点
			returnFiber.flags |= ChildDeletion; // 标记删除副作用
		} else {
			deletions.push(childToDelete);
		}
	}
	// 构建 ReactElement 的 Fiber
	function reconcileSingleElement(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null, // 这个是干嘛的
		element: ReactElementType
	) {
		// Update
		if (currentFiber !== null) {
			if (currentFiber.key === element.key) {
				if (element.$$typeof === REACT_ELEMENT_TYPE) {
					if (currentFiber.type === element.type) {
						// key 与 type 相同可复用
						const existing = useFiber(currentFiber, element.props);
						existing.return = returnFiber;
						return existing;
					} else {
						// 删掉旧的
						deleteChild(returnFiber, currentFiber);
					}
				} else {
					if (__DEV__) {
						console.warn('还未实现的 react 类型', element);
					}
				}
			} else {
				// 删掉旧的
				deleteChild(returnFiber, currentFiber);
				// LJQFLAG 是否需要 break ？
			}
		}
		// Mount | 删除后新建
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
		// Update
		if (currentFiber !== null) {
			// update
			if (currentFiber.tag === HostText) {
				// 可复用
				const existing = useFiber(currentFiber, { content });
				existing.return = returnFiber;
				return existing;
			}
			// 现在为非 TextNode 需要将原先 FiberNode 删除再构建新的 Fiber
			deleteChild(returnFiber, currentFiber);
		}
		// Mount
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
		// LJQFLAG 多节点情况暂未支持

		// HostComponent
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
		// HostText
		if (typeof newChild === 'string' || typeof newChild === 'number') {
			return placeSingleChild(
				reconcileSingleTextNode(returnFiber, currentFiber, newChild)
			);
		}
		if (__DEV__) console.warn('该节点不支持');
		// 兜底标记删除
		if (currentFiber) deleteChild(returnFiber, currentFiber);
		return null;
	};
}

// Fiber 服用
function useFiber(fiber: FiberNode, pendingProps: Props): FiberNode {
	const clone = createWorkInProgress(fiber, pendingProps);
	clone.index = 0;
	clone.sibling = null;
	return clone;
}

export const reconcileChildFibers = ChildReconcile(true);
export const mountChildFibers = ChildReconcile(false);
