import { FiberNode } from './ReactFiber';
import {
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText
} from './ReactWorkTags';
import { processUpdateQueue, UpdateQueue } from './ReactFiberClassUpdateQueue';
import { ReactElementType } from 'shared/ReactTypes';
import { mountChildFibers, reconcileChildFibers } from './ReactChildFiber';
import { renderWithHooks } from './ReactFiberHooks';

export function beginWork(workInProgress: FiberNode) {
	switch (workInProgress.tag) {
		case HostRoot:
			return updateHostRoot(workInProgress);
		case HostComponent:
			return updateHostComponent(workInProgress);
		case FunctionComponent:
			return updateFunctionComponent(workInProgress);
		case HostText:
			return null;
		default:
			if (__DEV__) {
				console.warn('beginWork类型未实现');
			}
			break;
	}
	return null;
}

function updateFunctionComponent(workInProgress: FiberNode) {
	const nextChildren = renderWithHooks(workInProgress);
	reconcileChildren(workInProgress, nextChildren);
	return workInProgress.child;
}

export function updateHostRoot(workInProgress: FiberNode) {
	// 计算状态最新值
	const baseState = workInProgress.memoizedState;
	const updateQueue = workInProgress.updateQueue as UpdateQueue<Element>;
	const pending = updateQueue.shared.pending;
	updateQueue.shared.pending = null;
	const { memoizedState } = processUpdateQueue(baseState, pending);
	workInProgress.memoizedState = memoizedState;

	// 创建子 FiberNode 并返回 (构建 Fiber 树的过程)
	const nextChildren = workInProgress.memoizedState;
	reconcileChildren(workInProgress, nextChildren);
	return workInProgress.child;
}

export function updateHostComponent(workInProgress: FiberNode) {
	// 创建子 FiberNode 并返回
	const nextProps = workInProgress.pendingProps;
	const nextChildren = nextProps.children;
	reconcileChildren(workInProgress, nextChildren);
	return workInProgress.child;
}

export function reconcileChildren(
	workInProgress: FiberNode,
	children?: ReactElementType
) {
	const current = workInProgress.alternate;
	if (current !== null) {
		// HostRootFiber 在初始化构建了 current 和 workInProgress 整个打标 Placement
		// update
		workInProgress.child = reconcileChildFibers(
			workInProgress,
			current?.child,
			children
		);
	} else {
		// mount
		// APP 没有 current 树会进行 mount 操作
		workInProgress.child = mountChildFibers(workInProgress, null, children);
	}
}
