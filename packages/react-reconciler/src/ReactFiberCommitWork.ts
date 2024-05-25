import { FiberNode, FiberRootNode } from './ReactFiber';
import { MutationMask, NoFlags, Placement, Ref } from './ReactFiberFlags';
import { HostComponent, HostRoot, HostText } from './ReactWorkTags';
import {
	appendChildToContainer,
	appendInitialChild,
	Container
} from 'hostConfig';

let nextEffect: FiberNode | null = null;
export const commitMutationEffects = (finishedWork: FiberNode) => {
	console.log('commitMutationEffects', finishedWork);
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
			// 向上遍历
			up: while (nextEffect !== null) {
				commitMutationEffectsOnFiber(nextEffect);
				const sibling: FiberNode | null = nextEffect.sibling;
				if (sibling !== null) {
					nextEffect = sibling;
					break up;
				}
				nextEffect = nextEffect.return;
			}
		}
	}
};

const commitMutationEffectsOnFiber = (finishedWork: FiberNode) => {
	console.log('commitMutationEffectsOnFiber', finishedWork);
	const flags = finishedWork.flags;
	if ((flags & Placement) !== NoFlags) {
		commitPlacement(finishedWork);
		// 移除 Placement Tag
		finishedWork.flags &= ~Placement;
	}
	// flags Update
	// flags ChildDeletion
};

const commitPlacement = (finishedWork: FiberNode) => {
	console.log(finishedWork, 'finishedWork');
	// parent DOM
	// finishedWork ~~ DOM
	if (__DEV__) console.warn('执行 placement 操作');

	const hostParent = getHostParent(finishedWork);

	console.log(hostParent, 'hostParent');

	if (hostParent) {
		// appendInitialChild(hostParent, finishedWork.stateNode);
		appendPlacementNodeIntoContainer(hostParent, finishedWork);
	}
};

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
		appendPlacementNodeIntoContainer(hostParent, finishedWork.stateNode);
		let sibling = child.sibling;
		while (sibling !== null) {
			appendPlacementNodeIntoContainer(hostParent, finishedWork.stateNode);
			sibling = sibling.sibling;
		}
	}
}
