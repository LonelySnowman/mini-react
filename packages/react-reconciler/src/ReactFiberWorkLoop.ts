import { beginWork } from './ReactFiberBeginWork';
import { completeWork } from './ReactFiberCompleteWork';
import { createWorkInProgress, FiberNode, FiberRootNode } from './ReactFiber';
import {
	HostEffectMask,
	MutationMask,
	NoFlags,
	PassiveMask
} from './ReactFiberFlags';
import { HostRoot } from './ReactWorkTags';
import { commitMutationEffects } from './ReactFiberCommitWork';

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
	// 确保获取到根 HostRootFiber 的 stateNode
	const root = markUpdateFromFiberToRoot(fiber);
	renderRoot(root);
}

/**
 * @description 获取到当前的 HostRootFiber stateNode
 * @param fiber
 */
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
// 开始进入渲染
function renderRoot(root: FiberRootNode) {
	// 初始化 workInProgress
	prepareFreshStack(root);
	// 开始工作循环
	// 使用浏览器空闲阶段进行处理
	do {
		try {
			workLoop();
			break;
		} catch (e) {
			console.warn('workLoop发生错误', e);
			workInProgress = null;
		}
	} while (true);

	// Fiber 树更新完成进行赋值
	root.finishedWork = root.current.alternate;
	// LJQFLAG 这里的赋值逻辑是什么
	if (root.current.alternate?.child)
		root.finishedWork = root.current.alternate.child;

	// commit 阶段进行渲染
	commitRoot(root);
}

function commitRoot(root: FiberRootNode) {
	const finishedWork = root.finishedWork;

	if (finishedWork === null) return;

	if (__DEV__) console.warn('commit 阶段开始', finishedWork);

	root.finishedWork = null;

	// 判断是否存在 3 个子阶段需要执行的操作
	const subtreeHasEffect =
		(finishedWork.subtreeFlags & MutationMask) !== NoFlags;
	const rootHasEffect = (finishedWork.flags & MutationMask) !== NoFlags;
	if (subtreeHasEffect || rootHasEffect) {
		// beforeMutation
		// mutation Placement
		commitMutationEffects(finishedWork);
		root.current = finishedWork;

		// layout
	} else {
		root.current = finishedWork;
	}
}

function workLoop() {
	// BeginWorkLoop 阶段
	while (workInProgress !== null) {
		performUnitOfWork(workInProgress);
	}
}

// 这里传入的 fiber 为 workInProgress
function performUnitOfWork(fiber: FiberNode) {
	// next 为子 FiberNode 深度优先遍历
	// 边向下边创建
	const next = beginWork(fiber);
	fiber.memoizedProps = fiber.pendingProps; // 变更更新后的 props
	if (next === null) {
		completeUnitOfWork(fiber);
	} else {
		workInProgress = next;
	}
}

// complete 阶段构建
function completeUnitOfWork(fiber: FiberNode) {
	let node: FiberNode | null = fiber;
	do {
		completeWork(node);

		// 向上遍历 sibling FiberNode
		const sibling = node?.sibling;
		if (sibling !== null) {
			workInProgress = sibling;
			return;
		}
		node = node?.return;
		workInProgress = node;
	} while (node !== null);
}
