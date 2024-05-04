import { Props, Key, Ref, ReactElementType, Wakeable } from 'shared/ReactTypes';
import {
	ContextProvider,
	Fragment,
	FunctionComponent,
	HostComponent,
	WorkTag,
	SuspenseComponent,
	OffscreenComponent,
	LazyComponent,
	MemoComponent
} from './ReactWorkTags';
import { Flags, NoFlags } from './ReactFiberFlags';
import { Container } from 'hostConfig';
import { Lane, Lanes, NoLane, NoLanes } from './fiberLanes';
import { Effect } from './fiberHooks';
import { CallbackNode } from 'scheduler';
import {
	REACT_MEMO_TYPE,
	REACT_PROVIDER_TYPE,
	REACT_LAZY_TYPE,
	REACT_SUSPENSE_TYPE
} from 'shared/ReactSymbols';
import { ContextItem } from './fiberContext';

interface FiberDependencies<Value> {
	firstContext: ContextItem<Value> | null;
	lanes: Lanes;
}

export class FiberNode {
	type: any;
	tag: WorkTag;
	pendingProps: Props;
	key: Key;
	stateNode: any;
	ref: Ref | null;

	return: FiberNode | null; // 父节点
	sibling: FiberNode | null; // 兄弟节点
	child: FiberNode | null; // 子节点
	index: number;

	memoizedProps: Props | null; // 更新后的 Props
	memoizedState: any; // 更新后的 State
	alternate: FiberNode | null; // 指向 currentFiberNode 当前的 Fiber
	flags: Flags; // 当前的副作用 FLags
	subtreeFlags: Flags; // 子树中包含的副作用 Flags
	updateQueue: unknown;
	deletions: FiberNode[] | null;

	lanes: Lanes;
	childLanes: Lanes;

	dependencies: FiberDependencies<any> | null;

	/**
	 * @description Fiber 节点构造函数
	 * @param tag 节点 Tag 类型
	 * @param pendingProps 即将改变的 props
	 * @param key 唯一 id
	 */
	constructor(tag: WorkTag, pendingProps: Props, key: Key) {
		this.tag = tag; // 节点 Tag 类型
		this.key = key || null; // 唯一 id
		// HostComponent <div> div DOM
		this.stateNode = null;
		// FunctionComponent () => {}
		this.type = null;
		this.ref = null;
		// 构成树状结构
		this.return = null; // 指向父 FiberNode
		this.sibling = null; // 指向兄弟 FiberNode
		this.child = null; // 指向子 FiberNode
		this.index = 0;

		// 作为工作单元
		this.pendingProps = pendingProps; // 刚开始工作时的 props
		this.memoizedProps = null; // 工作完成后的 props
		this.memoizedState = null;
		this.updateQueue = null;

		this.alternate = null;

		// 副作用变更 Flag
		this.flags = NoFlags;
		this.subtreeFlags = NoFlags;
		this.deletions = null;

		this.lanes = NoLanes;
		this.childLanes = NoLanes;

		this.dependencies = null;
	}
}

export interface PendingPassiveEffects {
	unmount: Effect[];
	update: Effect[];
}

// 根 FiberRoot React.createRoot
export class FiberRootNode {
	container: Container; // 挂载的 node
	current: FiberNode; // 根 DOM FiberNode (hostRootFiber)
	finishedWork: FiberNode | null; // 更新完成的 FiberNode (更新后的 hostRootFiber)
	pendingLanes: Lanes;
	suspendedLanes: Lanes;
	pingedLanes: Lanes;
	finishedLane: Lane;
	pendingPassiveEffects: PendingPassiveEffects;

	callbackNode: CallbackNode | null;
	callbackPriority: Lane;

	pingCache: WeakMap<Wakeable<any>, Set<Lane>> | null;

	constructor(container: Container, hostRootFiber: FiberNode) {
		this.container = container;
		this.current = hostRootFiber;
		hostRootFiber.stateNode = this;

		this.finishedWork = null;
		this.pendingLanes = NoLanes;
		this.suspendedLanes = NoLanes;
		this.pingedLanes = NoLanes;
		this.finishedLane = NoLane;

		this.callbackNode = null;
		this.callbackPriority = NoLane;

		this.pendingPassiveEffects = {
			unmount: [],
			update: []
		};

		this.pingCache = null;
	}
}

// 将 RootFiberNode 转换为 FiberNode
export const createWorkInProgress = (
	current: FiberNode,
	pendingProps: Props
): FiberNode => {
	// workInProgress = currentProgress
	let workInProgress = current.alternate;

	// 当前工作树为空 进行
	if (workInProgress === null) {
		// mount
		workInProgress = new FiberNode(current.tag, pendingProps, current.key);
		workInProgress.stateNode = current.stateNode;

		workInProgress.alternate = current;
		current.alternate = workInProgress;
	} else {
		// update
		workInProgress.pendingProps = pendingProps;
		workInProgress.flags = NoFlags;
		workInProgress.subtreeFlags = NoFlags;
		workInProgress.deletions = null;
	}
	workInProgress.type = current.type;
	workInProgress.updateQueue = current.updateQueue;
	workInProgress.child = current.child;
	workInProgress.memoizedProps = current.memoizedProps;
	workInProgress.memoizedState = current.memoizedState;
	workInProgress.ref = current.ref;

	workInProgress.lanes = current.lanes;
	workInProgress.childLanes = current.childLanes;

	const currentDeps = current.dependencies;
	workInProgress.dependencies =
		currentDeps === null
			? null
			: {
					lanes: currentDeps.lanes,
					firstContext: currentDeps.firstContext
				};

	return workInProgress;
};

// 将 ReactElement 转化为 Fiber 树
export function createFiberFromElement(element: ReactElementType): FiberNode {
	const { type, key, props, ref } = element;
	let fiberTag: WorkTag = FunctionComponent;

	if (typeof type === 'string') {
		// <div/> type: 'div'
		fiberTag = HostComponent;
	} else if (typeof type === 'object') {
		switch (type.$$typeof) {
			case REACT_PROVIDER_TYPE:
				fiberTag = ContextProvider;
				break;
			case REACT_MEMO_TYPE:
				fiberTag = MemoComponent;
				break;
			case REACT_LAZY_TYPE:
				fiberTag = LazyComponent;
			default:
				if (__DEV__) {
					console.warn('未定义的type类型', element);
				}
				break;
		}
	} else if (type === REACT_SUSPENSE_TYPE) {
		fiberTag = SuspenseComponent;
	} else if (typeof type !== 'function' && __DEV__) {
		console.warn('为定义的type类型', element);
	}

	// 新建 Fiber
	const fiber = new FiberNode(fiberTag, props, key);
	fiber.type = type;
	fiber.ref = ref;
	return fiber;
}

export function createFiberFromFragment(elements: any[], key: Key): FiberNode {
	const fiber = new FiberNode(Fragment, elements, key);
	return fiber;
}

export interface OffscreenProps {
	mode: 'visible' | 'hidden';
	children: any;
}

export function createFiberFromOffscreen(pendingProps: OffscreenProps) {
	const fiber = new FiberNode(OffscreenComponent, pendingProps, null);
	// TODO stateNode
	return fiber;
}
