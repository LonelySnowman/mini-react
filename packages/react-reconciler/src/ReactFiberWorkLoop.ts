import { beginWork } from './ReactFiberBeginWork';
import { completeWork } from './ReactFiberCompleteWork';
import {
	createWorkInProgress,
	FiberNode,
	FiberRootNode,
	PendingPassiveEffects
} from './ReactFiber';
import {
	HostEffectMask,
	MutationMask,
	NoFlags,
	PassiveMask
} from './ReactFiberFlags';
import { HostRoot } from './ReactWorkTags';

let workInProgress: FiberNode | null = null; // 当前工作的 FiberNode
const rootDoesHasPassiveEffects = false;

type RootExitStatus = number;
// 工作中的状态
const RootInProgress = 0;
// 并发中间状态
const RootInComplete = 1;
// 完成状态
const RootCompleted = 2;
// 未完成状态，不用进入commit阶段
const RootDidNotComplete = 3;
const workInProgressRootExitStatus: number = RootInProgress;

// Suspense
type SuspendedReason =
	| typeof NotSuspended
	| typeof SuspendedOnError
	| typeof SuspendedOnData
	| typeof SuspendedOnDeprecatedThrowPromise;
const NotSuspended = 0;
const SuspendedOnError = 1;
const SuspendedOnData = 2;
const SuspendedOnDeprecatedThrowPromise = 4;

const workInProgressSuspendedReason: SuspendedReason = NotSuspended;
const workInProgressThrownValue: any = null;

/**
 * @description 初始化 Fiber 树
 * @param root Fiber 树根节点
 * @param lane
 */
function prepareFreshStack(root: FiberRootNode) {
	workInProgress = createWorkInProgress(root.current, {});
}

export function scheduleUpdateOnFiber(fiber: FiberNode) {
	const root = markUpdateFromFiberToRoot(fiber);
	renderRoot(root);
}

export function markUpdateFromFiberToRoot(fiber: FiberNode) {
	let node = fiber;
	let parent = node.return;
	while (parent !== null) {
		node = parent;
		parent = node.return;
	}
	if (node.tag === HostRoot) {
		return node.stateNode;
	}
	return null;
}

/**
 * @description 开始执行更新 被 ReactDome.createRoot().render setState 调用
 * @param root
 * @param lane
 * @param shouldTimeSlice
 */
function renderRoot(root: FiberRootNode) {
	prepareFreshStack(root);
	// 开始工作循环
	do {
		try {
			workLoop();
			break;
		} catch (e) {
			console.warn('workLoop发生错误', e);
			workInProgress = null;
		}
	} while (true); // 使用浏览器空闲阶段进行处理

	const finishedWork = root.current.alternate;
	root.finishedWork = finishedWork;

	// commit 阶段进行渲染
	commitRoot(root);
}

/**
 *
 */
function workLoop() {
	while (workInProgress !== null) {
		performUnitOfWork(workInProgress);
	}
}

function performUnitOfWork(fiber: FiberNode) {
	const next = beginWork(fiber);
	fiber.memoizedProps = fiber.pendingProps; // 变更更新后的 props
	if (next === null) {
		completeUnitOfWork(fiber);
	} else {
		workInProgress = next;
	}
}

function completeUnitOfWork(fiber: FiberNode) {
	let node: FiberNode | null = fiber;
	do {
		completeWork(node);
		const sibling = node?.sibling;

		// 向上遍历 sibling FiberNode
		if (sibling !== null) {
			workInProgress = sibling;
			return;
		}
		node = node?.return;
		workInProgress = node;
	} while (node !== null);
}
