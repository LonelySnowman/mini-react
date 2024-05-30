import { Props, Key, Ref, ReactElementType } from 'shared/ReactTypes';
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
import {
	REACT_MEMO_TYPE,
	REACT_PROVIDER_TYPE,
	REACT_LAZY_TYPE,
	REACT_SUSPENSE_TYPE
} from 'shared/ReactSymbols';

export class FiberNode {
	type: any; // span div 等标签类型
	tag: WorkTag; // Fiber 类型 函数式组件/类式组件等
	pendingProps: Props; // 传递给组件的 props
	key: Key;
	stateNode: any; // children 对应的 ReactElement
	ref: Ref | null; // 引用
	return: FiberNode | null; // 父节点
	sibling: FiberNode | null; // 兄弟节点
	child: FiberNode | null; // 子节点
	index: number;
	memoizedProps: Props | null; // 更新后的 Props
	memoizedState: any; // 更新后的 State
	alternate: FiberNode | null; // 指向 currentFiberNode 当前的 Fiber ( current树和workInprogress树之间的相互引用)
	flags: Flags; // 当前的副作用 FLags
	subtreeFlags: Flags; // 子树中包含的副作用 Flags
	updateQueue: unknown;
	deletions: FiberNode[] | null;

	// lanes: Lanes;
	// childLanes: Lanes;
	//
	// dependencies: FiberDependencies<any> | null;

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

		// this.lanes = NoLanes;
		// this.childLanes = NoLanes;
		// this.dependencies = null;
	}
}

// export interface PendingPassiveEffects {
// 	unmount: Effect[];
// 	update: Effect[];
// }

// 根 FiberRoot React.createRoot
export class FiberRootNode {
	container: Container; // 挂载的 node
	current: FiberNode; // 根 DOM FiberNode (hostRootFiber)
	finishedWork: FiberNode | null; // 更新完成的 FiberNode (更新后的 hostRootFiber)
	constructor(container: Container, hostRootFiber: FiberNode) {
		this.container = container;
		this.current = hostRootFiber;
		hostRootFiber.stateNode = this;
		this.finishedWork = null;
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

	return workInProgress;
};

// 将 ReactElement 转化为 Fiber 树
export function createFiberFromElement(element: ReactElementType): FiberNode {
	const { type, key, props } = element;
	let fiberTag: WorkTag = FunctionComponent;

	if (typeof type === 'string') {
		// <div/> type: 'div'
		fiberTag = HostComponent;
	} else if (typeof type !== 'function' && __DEV__) {
		console.warn('为定义的type类型', element);
	}

	// 新建 Fiber
	const fiber = new FiberNode(fiberTag, props, key);
	fiber.type = type;
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
