# MiniReact

## React架构

- 调度更新（Scheduler 调度器）
- 决定需要更新什么组件（Reconciler 协调器）
- 将组件更新到视图中（Renderer 渲染器）

## React源码结构

经过之前的学习，我们已经知道`React16`的架构分为三层：

- Scheduler（调度器）—— 调度任务的优先级，高优任务优先进入**Reconciler**
- Reconciler（协调器）—— 负责找出变化的组件
- Renderer（渲染器）—— 负责将变化的组件渲染到页面上

那么架构是如何体现在源码的文件结构上呢，让我们一起看看吧。

### 顶层目录

除去配置文件和隐藏文件夹，根目录的文件夹包括三个：

```text
根目录
├── fixtures        # 包含一些给贡献者准备的小型 React 测试项目
├── packages        # 包含元数据（比如 package.json）和 React 仓库中所有 package 的源码（子目录 src）
├── scripts         # 各种工具链的脚本，比如git、jest、eslint等
```

这里我们关注**packages**目录

### packages目录

目录下的文件夹非常多，我们来看下：

#### react文件夹

React的核心，包含所有全局 React API，如：

- React.createElement
- React.Component
- React.Children

这些 API 是全平台通用的，它不包含`ReactDOM`、`ReactNative`等平台特定的代码。在 NPM 上作为[单独的一个包](https://www.npmjs.com/package/react)发布。

#### scheduler文件夹

Scheduler（调度器）的实现。

#### shared文件夹

源码中其他模块公用的**方法**和**全局变量**，比如在[shared/ReactSymbols.js](https://github.com/facebook/react/blob/970fa122d8188bafa600e9b5214833487fbf1092/packages/shared/ReactSymbols.js)中保存`React`不同组件类型的定义。

```js
// ...
export let REACT_ELEMENT_TYPE = 0xeac7;
export let REACT_PORTAL_TYPE = 0xeaca;
export let REACT_FRAGMENT_TYPE = 0xeacb;
// ...
```

### Renderer相关的文件夹

如下几个文件夹为对应的**Renderer**

```text
- react-art
- react-dom                 # 注意这同时是DOM和SSR（服务端渲染）的入口
- react-native-renderer
- react-noop-renderer       # 用于debug fiber（后面会介绍fiber）
- react-test-renderer
```

### 试验性包的文件夹

`React`将自己流程中的一部分抽离出来，形成可以独立使用的包，由于他们是试验性质的，所以不被建议在生产环境使用。包括如下文件夹：

```text
- react-server        # 创建自定义SSR流
- react-client        # 创建自定义的流
- react-fetch         # 用于数据请求
- react-interactions  # 用于测试交互相关的内部特性，比如React的事件模型
- react-reconciler    # Reconciler的实现，你可以用他构建自己的Renderer
```

### 辅助包的文件夹

`React`将一些辅助功能形成单独的包。包括如下文件夹：

```text
- react-is       # 用于测试组件是否是某类型
- react-client   # 创建自定义的流
- react-fetch    # 用于数据请求
- react-refresh  # “热重载”的React官方实现
```

### react-reconciler文件夹

我们需要重点关注**react-reconciler**，在接下来源码学习中 80%的代码量都来自这个包。

虽然他是一个实验性的包，内部的很多功能在正式版本中还未开放。但是他一边对接**Scheduler**，一边对接不同平台的**Renderer**，构成了整个 React16 的架构体系。


## MiniReact 实现

### 实现 jsx 解析

第一步 babel 转义 jsx 文件，jsx 都会被转化为 jsx 函数返回 ReactElement

- packages/react/src/jsx.ts
- packages/react/index.ts
- packages/shared/ReactSymbols.ts
- packages/shared/ReactTypes.ts
- scripts/rollup/react.config.js
- scripts/rollup/utils.js

===

- jsx 转化为 ReactElement，ReactElement 只是与对用户编写 jsx 的转化。
- 不能表达与其他模块的关系。
- 不能表达节点变更的状态

### 实现 fiber 协调器

协调器负责计算节点的变化

1. 产生新的 ReactElement
2. ReactElement 转化为 Fiber 树
3. 新的 Fiber 树与旧的 Fiber 树进行比较
4. 对比出更新操作标记 Flag (增删改查等)
5. 根据 Flag 执行更新

双缓冲架构
- current：与真实 UI 对应的 Fiber 树
- workInProgress：更新后的 Fiber 树

jsx 消费过程
- dfs 有子遍历子，无子遍历兄弟

===

- packages/react-reconciler/src/fiber.ts Fiber 数据结构 1
- packages/react-reconciler/src/workTags.ts Fiber 节点类型 2
- packages/react-reconciler/src/fiberFlags.ts Fiber 变更 Flag 3
- workLoop 4 循环更新工作
- beginWork 5 开始更新操作
- completeWork 6 结束更新操作
- queue 7 更新队列

## 触发更新

- 触发更新的方法 createRoot setState

记录一个 update 队列记录更新的状态，然后去消费这个队列进行更新！
updateQueue 进行记录


- `React.createRoot(rootElement).render(<APP/>)`

React.createRoot 创建当前路径统一根节点Fiber FiberRootNode，根 DOM Fiber 节点 hostRootFiber 子节点为 APP
FiberRootNode.current = hostRootFiber, hostRootFiber.stateNode = FiberRootNode


## Mount 流程

### BeginWork

副作用只有两个

副作用变化 Flags
- Placement 插入/移动 副作用
- ChildDeletion 子节点删除 副作用

BeginWork 性能优化策略

```jsx
<div>
 <p>P Text</p>
 <span>Span Text</span>
</div>
```
理论上需要对每个 DOM 节点和 TEXT 标记五次 Placement 操作

可以内部进行 离屏DOM 构建 只对根节点进行一次 Placement


### CompleteWork
- 对于 Host 类型的 FiberNode 构建离屏的 DOM 树
- 标记 Update Flag

CompleteWork 优化策略
flags 分布在不同的 fiberNode 中 如何快速找到他们？

利用 completeWork 向上遍历的流程 将子 fiberNode 的 flags 冒泡到父 fiberNode

bubbleProperties 收集 subtreeFlags

## ReactDOM 实现

react 三个阶段
- schedule 阶段 (调度阶段 调度更新)
- render 阶段 beginWork completeWork
- commit 阶段

commit 阶段的三个子阶段
- beforeMutation 阶段
- mutation 阶段
- layout 阶段

具体内容
- fiber 树的切换
- Placement 对应操作



## 函数式组件实现



## 实现 useState

- hooks 必须在函数式组件中才有意义(hooks 的约定，只能在函数式组件中使用)，否则只是一个普通函数，需要感知上下文。
- 解决方案：在不同上下文中调用的 hook 不是同一个函数。

需要实现数据共享层，在不同包之间共享使用的 HOOKS 集合。



# 原理链路梳理

## 从 main.tsx 开始

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';

const jsx = (
	<div>
		<span>mini-react</span>
	</div>
);

ReactDOM.createRoot(document.getElementById('root')!).render(jsx);
```



需要理解的数据结构：

```js
// ReactElement
{
    $$typeof: REACT_ELEMENT_TYPE,
    type, // dom 类型 span/div ...
    key,
    ref,
    props
}
```

```js
// FiberNode
class FiberNode {
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
}
```

```js
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
```



- JSX 转换

  - react 包实现，babel 插件将使用 react/jsx-dev-runtime 包中的 jsxDev 方法进将 jsx 转化为 ReactElement。
- ReactDom 使用

  - 入口中使用 createRoot 与 render 进行实现，
  - React.createRoot 创建当前路径统一根节点Fiber FiberRootNode，根 DOM Fiber 节点 hostRootFiber 子节点为 APP
    FiberRootNode.current = hostRootFiber, hostRootFiber.stateNode = FiberRootNode

1. createContainer 创建根节点 (FiberRootNode 与 HostRootFiber)

2. updateContainer 根据传入的 <APP/> ReactElement 更新根节点
   1. 向根 Fiber 添加更新状态 action:element
   2. 触发调度更新机制(触发 renderRoot)
   
3. renderRoot
   1. prepareFreshStack：初始化 workInProgress
   
   2. workInProgress = current.alternate // workInProgress = currentProgress
   
   3. workInProgress(现在已经是先前的FiberNode树)，为空进入 Mount，不为空进入 update；
      1. Mount：workInProgress = new Fiber，赋值 stateNode alternate
      2. Update：清空副作用
      3. 均需要各种赋值，取 current 的元素
   
   4. 开启 workLoop/BeginWorkLoop 阶段（深度优先搜索，自顶向下创建 Fiber，标记副作用）
      1. beginWork 需要根据不同的节点类型做出不同状态的更新。
      2. 根据 props 中的 child / 根据 memoizedState 获取子 Fiber 并返回
         1. ChildReconcile 创建子 Fiber
         2. 创建子 Fiber 分 Mount 与 Update 状态，区别是传入的 current.child 不同
         3. 根据 ReactElement 的 children 进行构建不同的子 Fiber 并标记副作用
         4. 更新 Props (fiber.memoizedProps = fiber.pendingProps) 
      3. 从上至下依次进行构建直至 workInProgress === null
   
   5. 开始 completeUnitOfWork 阶段（从下至上进行处理，`bubbleProperties` 收集子 Fiber 的副作用，appendAllChildren 插入 stateNode 内存中的 dom（构建 stateNode））
   
      1. 不同 Fiber 类型进行不同的处理
   
         1. HostComponent/HostText 直接 `appendAllChildren` 找到所有可插入的 dom 进行插入 stateNode
   
         2. 子节点 -> 兄弟节点 -> 父节点 (直至遍历到顶部 HostRoot.return = null)
   
         3. ```js
            // Fiber 树更新完成进行赋值
            root.finishedWork = root.current.alternate;
            if (root.current.alternate?.child)
                root.finishedWork = root.current.alternate.child;
            ```
   
   6. commitRoot 阶段进行挂载（先到最底层，从 子节点 -> 兄弟节点 -> 父节点 依次执行副作用）
   
      1. 根据 finishedWork subtreeFlags 和 flags 判断是否有需要执行的副作用。
      2. 有副作用执行副作用 `commitMutationEffects` 副作用执行流程不熟悉
      3. current 树转化为 finishedWork 也就是构建好的 workInProgress

// 看看两个 LJQFLAG

