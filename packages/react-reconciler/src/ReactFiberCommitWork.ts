import { FiberNode, FiberRootNode } from './ReactFiber';
import {
	ChildDeletion,
	MutationMask,
	NoFlags,
	Placement,
	Ref,
	Update
} from './ReactFiberFlags';
import {
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText
} from './ReactWorkTags';
import {
	appendChildToContainer,
	appendInitialChild,
	commitUpdate,
	Container,
	removeChild
} from 'hostConfig';

let nextEffect: FiberNode | null = null;
export const commitMutationEffects = (finishedWork: FiberNode) => {
	nextEffect = finishedWork;
	// 找到第一个 NoFlags 的 Fiber
	// 然后向上遍历消费 tag
	while (nextEffect !== null) {
		// 向下遍历
		const child: FiberNode | null = nextEffect.child;
		if (
			(nextEffect.subtreeFlags & MutationMask) !== NoFlags &&
			child !== null
		) {
			nextEffect = child;
		} else {
			// 遍历到最底部的 Fiber
			// 向上遍历
			up: while (nextEffect !== null) {
				commitMutationEffectsOnFiber(nextEffect);
				const sibling: FiberNode | null = nextEffect.sibling;
				if (sibling !== null) {
					nextEffect = sibling;
					break up; // LJQFLAG 为什么 break 掉
				}
				nextEffect = nextEffect.return;
			}
		}
	}
};

const commitMutationEffectsOnFiber = (finishedWork: FiberNode) => {
	const flags = finishedWork.flags;
	// flags Placement
	if ((flags & Placement) !== NoFlags) {
		commitPlacement(finishedWork);
		// 移除 Placement Tag
		finishedWork.flags &= ~Placement;
	}
	// flags Update
	if ((flags & Update) !== NoFlags) {
		commitUpdate(finishedWork);
		finishedWork.flags &= ~Update;
	}
	// flags ChildDeletion
	if ((flags & ChildDeletion) !== NoFlags) {
		const deletions = finishedWork.deletions;
		if (deletions !== null) {
			deletions.forEach((childToDelete) => {
				commitDeletion(childToDelete);
			});
		}
		finishedWork.flags &= ~ChildDeletion;
	}
};

const commitPlacement = (finishedWork: FiberNode) => {
	// parent DOM
	// finishedWork ~~ DOM
	if (__DEV__) console.warn('执行 placement 操作');
	const hostParent = getHostParent(finishedWork);
	if (hostParent) {
		appendPlacementNodeIntoContainer(hostParent, finishedWork);
	}
};

function commitDeletion(childToDelete: FiberNode) {
	let rootHostNode: FiberNode | null = null;
	// 递归子树
	commitNestedComponent(childToDelete, (unmountFiber: FiberNode) => {
		switch (unmountFiber.tag) {
			case HostComponent:
				// 标记 root component
				if (rootHostNode === null) rootHostNode = unmountFiber;
				// TODO 解绑 Ref
				return;
			case HostText:
				if (rootHostNode === null) rootHostNode = unmountFiber;
				return;
			case FunctionComponent:
				// FunctionComponent Fiber上无实际内容
				// TODO UseEffect unMount 处理
				return;
			default:
				console.warn('未处理的 unmount 类型');
				return;
		}
	});

	// 移除 rootHostComponent 的 DOM
	// 找到顶部需要删除的节点
	// 在 hostParent 中删除该节点（页面中移除）
	if (rootHostNode !== null) {
		const hostParent = getHostParent(childToDelete);
		if (hostParent !== null) removeChild((rootHostNode as FiberNode).stateNode, hostParent);
	}
	// 节点在 Fiber 树中移除
	childToDelete.return = null;
	childToDelete.child = null;
}

function commitNestedComponent(
	root: FiberNode,
	onCommitUnmount: (fiber: FiberNode) => void
) {
	let node = root;
	while (true) {
		onCommitUnmount(node); // 需要清除副作用
		// 向下遍历的过程
		if (node.child !== null) {
			node.child.return = node;
			node = node.child;
			continue;
		}
		// 终止条件
		if (node === root) return;
		while (node.sibling === null) {
			if (node.return === null || node.return === root) return;
			node = node.return;
		}
		node.sibling.return = node.return;
		node = node.sibling;
	}
}

function getHostParent(fiber: FiberNode): Container | null {
	let parent = fiber.return;
	while (parent) {
		const parentTag = parent.tag;
		if (parentTag === HostComponent) {
			return parent.stateNode as Container;
		}
		if (parentTag === HostRoot) {
			return (parent.stateNode as FiberRootNode).container;
		}
		parent = parent.return;
	}
	if (__DEV__) console.warn('未找到 HOST Parent');
	return null;
}

// LJQFLAG 为什么只插入一个
function appendPlacementNodeIntoContainer(
	hostParent: Container,
	finishedWork: FiberNode
) {
	if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
		appendChildToContainer(hostParent, finishedWork.stateNode);
		return;
	}
	// 递归寻找 插入子节点及其 sibling
	const child = finishedWork.child;
	if (child !== null) {
		appendPlacementNodeIntoContainer(hostParent, child);
		let sibling = child.sibling;
		while (sibling !== null) {
			appendPlacementNodeIntoContainer(hostParent, sibling);
			sibling = sibling.sibling;
		}
	}
}
