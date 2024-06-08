import { FiberNode } from './ReactFiber';
import internals from 'shared/internals';
import { Dispatcher, Dispatch } from 'react/src/ReactCurrentDispatcher';
import {
	createUpdate,
	createUpdateQueue,
	enqueueUpdate,
	processUpdateQueue,
	UpdateQueue
} from './ReactFiberClassUpdateQueue';
import { Action } from 'shared/ReactTypes';
import { scheduleUpdateOnFiber } from './ReactFiberWorkLoop';
const { currentDispatcher } = internals;

let currentlyRenderingFiber: FiberNode | null = null; // 当前正在 Render 的 FC
let workInProgressHook: Hook | null = null; // 当前正在处理的 Hook
let currentHook: Hook | null = null; // workInProgress 对应 current 树的 Hook

interface Hook {
	memoizedState: any; // Hooks 自身状态值
	updateQueue: any;
	next: Hook | null; // 下一个 Hook
}

// 在 FiberNode 中保存 Hook
export function renderWithHooks(workInProgress: FiberNode) {
	// 赋值操作
	currentlyRenderingFiber = workInProgress;
	// 重置 hooks 链表
	workInProgress.memoizedState = null;
	const current = workInProgress.alternate;

	// 指向不同的 Hooks 环境
	if (current !== null) {
		// update
		currentDispatcher.current = HooksDispatcherOnUpdate;

	} else {
		// mount
		currentDispatcher.current = HooksDispatcherOnMount;
	}

	const Component = workInProgress.type;
	const props = workInProgress.pendingProps;
	const children = Component(props);

	// 重置操作
	currentlyRenderingFiber = null;
	workInProgressHook = null;
	currentHook = null;
	return children;
}

function dispatchSetState<State>(
	fiber: FiberNode | null,
	updateQueue: UpdateQueue<State>,
	action: Action<State>
) {
	// 创建 update
	const update = createUpdate(action);
	// 注册 update
	enqueueUpdate(updateQueue, update);
	// 消费 update
	// @ts-ignore
	scheduleUpdateOnFiber(fiber);
}

function mountWorkInProgressHook(): Hook {
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

function mountState<State>(
	initialState: (() => State) | State
): [State, Dispatch<State>] {
	// 找到当前 useState 对回应的 hook 数据
	// mount 是新建 hooks 数据
	const hook = mountWorkInProgressHook();
	let memoizedState;
	if (initialState instanceof Function) {
		memoizedState = initialState();
	} else {
		memoizedState = initialState;
	}
	const queue = createUpdateQueue<State>();
	hook.updateQueue = queue;

	// LJQFLAG 更新流程
	// @ts-ignore
	const dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue);
	queue.dispatch = dispatch;
	return [memoizedState, dispatch];
}

export function updateWorkInProgressHook(): Hook {
	// TODO LJQFALG render 阶段触发的更新
	let nextCurrentHook: Hook | null = null; // 下一个 Hook
	if (currentHook === null) {
		// 这是这个 FC update 时的第一个 hook
		const current = currentlyRenderingFiber?.alternate;
		if (current !== null) {
			nextCurrentHook = current?.memoizedState;
		} else {
			nextCurrentHook = null;
		}
	} else {
		// 这个 FC update 时后续的 hook
		nextCurrentHook = currentHook.next;
	}

	// 错误逻辑/边界情况
	// hooks 放置在条件语句中导致与 current.memoizedState 不对应
	if (nextCurrentHook === null) {
		if (__DEV__) console.warn('本次更新 Hooks 数量多于上一次');
	}

	currentHook = nextCurrentHook as Hook;
	const newHook: Hook = {
		memoizedState: currentHook.memoizedState,
		updateQueue: currentHook.updateQueue,
		next: null
	};
	// 与 mount 时逻辑一致
	if (workInProgressHook === null) {
		// mount 时第一个 hook
		if (currentlyRenderingFiber === null) {
			// 没有在函数组件内调用 HOOK
			throw new Error('请在函数组件内调用 HOOK');
		} else {
			workInProgressHook = newHook;
			currentlyRenderingFiber.memoizedState = workInProgressHook;
		}
	} else {
		// mount 时后续的 hook
		workInProgressHook.next = newHook;
		workInProgressHook = newHook;
	}
	return workInProgressHook;
}

function updateState<State>(): [State, Dispatch<State>] {
	// 找到当前 useState 对回应的 hook 数据
	const hook = updateWorkInProgressHook();

	// 计算新的 state
	const queue = hook.updateQueue as UpdateQueue<State>;
	const pending = queue.shared.pending;

	if (pending !== null) {
		const { memoizedState } = processUpdateQueue(hook.memoizedState, pending);
		hook.memoizedState = memoizedState;
	}

	return [hook.memoizedState, queue.dispatch as Dispatch<State>];
}

// Mount 集合
const HooksDispatcherOnMount: Dispatcher = {
	useState: mountState
};

// Mount 集合
const HooksDispatcherOnUpdate: Dispatcher = {
	useState: updateState
};
