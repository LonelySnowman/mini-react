import { FiberNode } from './ReactFiber';
import internals from 'shared/internals';
import { Dispatcher, Dispatch } from 'react/src/ReactCurrentDispatcher';
import {
	createUpdate,
	createUpdateQueue,
	enqueueUpdate,
	UpdateQueue
} from './ReactFiberClassUpdateQueue';
import { Action } from 'shared/ReactTypes';
import { scheduleUpdateOnFiber } from './ReactFiberWorkLoop';
const { currentDispatcher } = internals;

let currentlyRenderingFiber: FiberNode | null = null; // 当前正在 Render 的 FC
let workInProgressHook: Hook | null = null; // 当前正在处理的 Hook
interface Hook {
	memoizedState: any; // Hooks 自身状态值
	updateQueue: any;
	next: Hook | null; // 下一个 Hook
}

// 在 FiberNode 中保存 Hook
export function renderWithHooks(workInProgress: FiberNode) {
	// 赋值操作
	currentlyRenderingFiber = workInProgress;
	workInProgress.memoizedState = null;

	const current = workInProgress.alternate;

	if (current !== null) {
		// update
	} else {
		// mount
		currentDispatcher.current = HooksDispatcherOnMount;
	}

	const Component = workInProgress.type;
	const props = workInProgress.pendingProps;
	const children = Component(props);

	// 重置操作
	currentlyRenderingFiber = null;
	return children;
}

// Mount 集合
const HooksDispatcherOnMount: Dispatcher = {
	useState: mountState
};

function mountState<State>(
	initialState: (() => State) | State
): [State, Dispatch<State>] {
	// 找到当前 useState 对回应的 hook 数据
	const hook = mountWorkInProgress();
	let memoizedState;
	if (initialState instanceof Function) {
		memoizedState = initialState();
	} else {
		memoizedState = initialState;
	}
	const queue = createUpdateQueue<State>();
	hook.updateQueue = queue;

	// LJQFLAG 更新流程
	const dispatch = dispatchSetState.bind(
		null,
		currentlyRenderingFiber,
		queue,
		initialState
	);
	queue.dispatch = dispatch;
	return [memoizedState, dispatch];
}

function dispatchSetState<State>(
	fiber: FiberNode,
	updateQueue: UpdateQueue<State>,
	action: Action<State>
) {
	// 创建 update
	const update = createUpdate(action);
	// 注册 update
	enqueueUpdate(updateQueue, update);
	// 消费 update
	scheduleUpdateOnFiber(fiber);
}

function mountWorkInProgress(): Hook {
	const hook: Hook = {
		memoizedState: null,
		updateQueue: null,
		next: null
	};
	if (workInProgressHook === null) {
		// mount 时第一个 hook
		if (currentlyRenderingFiber === null) {
			// 没有在函数组件内调用 HOOK
			throw new Error('请在函数组件内调用 HOOK');
		} else {
			workInProgressHook = hook;
			currentlyRenderingFiber.memoizedState = workInProgressHook;
		}
	} else {
		// mount 时后续的 hook
		workInProgressHook.next = hook;
		workInProgressHook = hook;
	}
	return workInProgressHook;
}
