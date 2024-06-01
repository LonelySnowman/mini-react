export type WorkTag =
	| typeof FunctionComponent
	| typeof HostRoot
	| typeof HostComponent
	| typeof HostText
	| typeof Fragment
	| typeof ContextProvider
	| typeof SuspenseComponent
	| typeof OffscreenComponent
	| typeof LazyComponent
	| typeof MemoComponent;

export const FunctionComponent = 0; // Function Component 对应的类型
export const HostRoot = 3; // React Root 对应的根节点类型
export const HostComponent = 5; // <div></div> 对应的类型
export const HostText = 6; // <div>123</div> 文本节点 123 对应的类型
export const Fragment = 7;
export const ContextProvider = 8;
export const SuspenseComponent = 13;
export const OffscreenComponent = 14;
export const LazyComponent = 16;
export const MemoComponent = 15;
