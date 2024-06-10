import {
	createFiberFromElement,
	createWorkInProgress,
	FiberNode
} from './ReactFiber';
import { Props, ReactElementType } from 'shared/ReactTypes';
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import { HostText } from './ReactWorkTags';
import { ChildDeletion, Placement } from './ReactFiberFlags';

type ExistingChildren = Map<string | number, FiberNode>;

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
	function deleteRemainingChildren(returnFiber: FiberNode, currentFirstChild: FiberNode | null) {
		if (!shouldTrackEffects) return;
		let childToDelete = currentFirstChild;
		while (childToDelete !== null) {
			deleteChild(returnFiber, childToDelete);
			childToDelete = childToDelete.sibling; // 遍历 sibling 标记为删除
		}
	}
	// 构建 ReactElement 的 Fiber
	function reconcileSingleElement(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null, // 这个是干嘛的
		element: ReactElementType
	) {
		// Update
		while (currentFiber !== null) {
			if (currentFiber.key === element.key) {
				if (element.$$typeof === REACT_ELEMENT_TYPE) {
					if (currentFiber.type === element.type) {
						// 1.key相同 type相同 直接复用
						const existing = useFiber(currentFiber, element.props);
						existing.return = returnFiber;
						// 当前节点可复用 标记其他节点删除(当前节点之后的兄弟节点)
						deleteRemainingChildren(returnFiber, currentFiber.sibling);
						return existing;
					} else {
						// 2.key相同 type不同 不可复用
						deleteRemainingChildren(returnFiber, currentFiber); // 删除无需复用的节点
						break;
					}
				} else {
					if (__DEV__) {
						console.warn('还未实现的 react 类型', element);
						break;
					}
				}
			} else {
				// 3.key不同当前节点不能复用继续遍历 sibling
				deleteChild(returnFiber, currentFiber);
				currentFiber = currentFiber.sibling;
			}
		}
		// 遍历完成均无法复用|Mount阶段
		const fiber = createFiberFromElement(element); // 创建新的 Fiber
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
			if (currentFiber.tag === HostText) {
				// 1.类型没有变化可复用
				const existing = useFiber(currentFiber, { content });
				existing.return = returnFiber;
				deleteRemainingChildren(returnFiber, currentFiber.sibling);
				return existing;
			}
			// 现在为非 TextNode 需要将原先 FiberNode 删除再构建新的 Fiber
			deleteChild(returnFiber, currentFiber);
			currentFiber = currentFiber.sibling;
		}
		// Mount阶段|无可复用节点
		const fiber = new FiberNode(HostText, { content }, null); // 构造新的 Fiber
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

	function reconcileChildrenArray(returnFiber: FiberNode, currentFirstChild: FiberNode | null, newChild: any[]) {
		// 最后一个可复用 Fiber 在 current 树中的索引
		let lastPlacedIndex: number = 0;
		let lastNewFiber: FiberNode | null = null;
		let firstNewFiber: FiberNode | null = null; // 复用的第一个 Fiber
		// 1.将 current 保存在 Map 中
		const existingChildren: ExistingChildren = new Map();
		let current = currentFirstChild;
		while (current !== null) {
			// props 未传入 key 默认以 index 作为 key
			const keyToUse = current.key !== null ? current.key : current.index;
			existingChildren.set(keyToUse, current);
			current = current.sibling;
		}
		// 2.遍历 newChild 寻找是否可复用
		for (let i=0;i<newChild.length;i++) {
			const after = newChild[i];
			const newFiber = updateFromMap(returnFiber, existingChildren, i, after);
			if (newFiber === null) continue; // 不可复用继续
			// 3.标记移动还是插入
			newFiber.index = i;
			newFiber.return = returnFiber;

			if (lastNewFiber === null) {
				lastNewFiber = newFiber;
				firstNewFiber = newFiber;
			} else {
				lastNewFiber.sibling = newFiber;
				lastNewFiber = lastNewFiber.sibling;
			}

			if (!shouldTrackEffects) continue;
			const current = newFiber.alternate;
			if (current !== null) {
				const oldIndex = current.index;
				if (oldIndex < lastPlacedIndex) {
					// 移动
					newFiber.flags |= Placement;
					continue;
				} else {
					// 不移动
					lastPlacedIndex = oldIndex;
				}
			} else {
				// mount (对应插入)
				newFiber.flags |= Placement;
			}
		}
		// 4.将无需复用的节点标记删除
		existingChildren.forEach(fiber=>{
			deleteChild(returnFiber, fiber);
		})
		return firstNewFiber;
	}

	// 从 Map 中进行复用
	function updateFromMap(returnFiber: FiberNode, existringChildren: ExistingChildren, index: number, element: any): FiberNode | null {
		// props 未传入 key 默认以 index 作为 key
		const keyToUse = element.key !== null ? element.key : element.index;
		const before = existringChildren.get(keyToUse)
		if (typeof element === 'string' || typeof element === 'number') {
			if (before) {
				if (before.tag === HostText) {
					existringChildren.delete(keyToUse);
					return useFiber(before, { content: String(element) });
				}
				return new FiberNode(HostText, { content: String(element) }, null);
			}
		}

		// ReactElement
		if (typeof element === 'object' && element !== null) {
			switch (element.$$typeof) {
				case REACT_ELEMENT_TYPE:
					if (before) {
						if (before.type === element.type) {
							existringChildren.delete(keyToUse);
							return useFiber(before, element.props);
						}
					}
					return createFiberFromElement(element);
				default:
					console.warn(`未实现的 element type ${element}`);
					break;
			}
		}

		// TODO 数据类型
		if (Array.isArray(element) && __DEV__) {
			console.warn('数组类型 child 未实现');
		}

		// 不可复用返回 null
		return null;
	}

	return function reconcileChildFibers(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		newChild?: ReactElementType | string | number
	) {
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

		if (Array.isArray(newChild)) {
			reconcileChildrenArray(returnFiber, currentFiber, newChild) {
				
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
