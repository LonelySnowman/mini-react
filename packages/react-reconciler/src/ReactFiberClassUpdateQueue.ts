import { Action } from 'shared/ReactTypes';
import { Dispatch } from 'react/src/ReactCurrentDispatcher';
import * as buffer from 'buffer';

/*
代表更新的数据结构 update
消费 update 的数据结构 updateQueue
 */
export interface Update<State> {
	action: Action<State>;
}

export interface UpdateQueue<State> {
	shared: {
		pending: Update<State> | null;
	};
	dispatch: Dispatch<State> | null;
}

// 创建更新状态对象
export const createUpdate = <State>(action: Action<State>) => {
	return {
		action
	};
};

// 创建更新状态队列
export const createUpdateQueue = <State>() => {
	return {
		shared: {
			pending: null
		},
		dispatch: null
	} as UpdateQueue<State>;
};

// 向队列添加 update 对象
export const enqueueUpdate = <State>(
	updateQueue: UpdateQueue<State>,
	update: Update<State>
) => {
	updateQueue.shared.pending = update;
};

// 消费 update 队列进行更新
export const processUpdateQueue = <State>(
	baseState: State,
	pendingUpdate: Update<State> | null
): { memoizedState: State } => {
	const result: ReturnType<typeof processUpdateQueue<State>> = {
		memoizedState: baseState
	};
	if (pendingUpdate !== null) {
		// 更新两种情况 传入更新后的值或者函数
		const action = pendingUpdate.action;
		if (action instanceof Function) {
			result.memoizedState = action(baseState);
		} else {
			result.memoizedState = action;
		}
	}

	return result;
};
