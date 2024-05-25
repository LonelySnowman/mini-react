import { FiberNode } from './ReactFiber';
import { HostComponent, HostRoot, HostText } from './ReactWorkTags';
import {
	appendInitialChild,
	Container,
	createInstance,
	createTextInstance
} from 'hostConfig';
import { NoFlags } from './ReactFiberFlags';

export const completeWork = (workInProgress: FiberNode | null) => {
	const newProps = workInProgress?.pendingProps;
	const current = workInProgress?.alternate;

	switch (workInProgress?.tag) {
		case HostRoot:
			return null;
		case HostComponent:
			// stateNode 为保存的 DOM 节点
			if (current !== null && workInProgress.stateNode) {
				// update
			} else {
				// 1. 构建 DOM
				const instance = createInstance(workInProgress.type, newProps);
				// 2. 将 DOM 插入到 fiberNode 中的 stateNode
				appendAllChildren(instance, workInProgress);
				workInProgress.stateNode = instance;
			}
			bubbleProperties(workInProgress);
			return null;
		case HostText:
			// stateNode 为保存的 DOM 节点
			if (current !== null && workInProgress.stateNode) {
				// update
			} else {
				// 1. 构建 DOM
				const instance = createTextInstance(newProps.content);
				// 2. 将 DOM 插入到 DOM 树
				workInProgress.stateNode = instance;
			}
			bubbleProperties(workInProgress);
			return null;
		default:
			if (__DEV__) console.warn('该 wip tag 未实现', workInProgress?.tag);
			break;
	}
};

function appendAllChildren(parent: Container, workInProgress: FiberNode) {
	let node = workInProgress.child;
	while (node !== null) {
		// 深度优先遍历
		if (node?.tag === HostComponent || node?.tag === HostText) {
			// 找到可插入节点进行插入
			appendInitialChild(parent, node?.stateNode);
		} else if (node.child !== null) {
			// 没有找到继续向下找
			node.child.return = node;
			node = node.child;
			continue;
		}

		// 子节点为空向兄弟节点遍历

		// 当前节点回到了 workInProgress 结束递归
		if (node === workInProgress) return;

		// 兄弟节点为空向上遍历
		while (node.sibling === null) {
			if (node.return === null || node.return === workInProgress) return;
			node = node.return;
		}

		// 设置 sibling 的父节点
		node.sibling.return = node.return;
		// 向上找兄弟节点
		node = node.sibling;
	}
}

// 收集 subtreeFlags
function bubbleProperties(workInProgress: FiberNode) {
	let subtreeFlags = NoFlags;
	let node = workInProgress.child;
	while (node !== null) {
		subtreeFlags |= node.subtreeFlags;
		subtreeFlags |= workInProgress.flags;

		node.return = workInProgress;
		node = node.sibling;
	}

	workInProgress.subtreeFlags = subtreeFlags;
}
