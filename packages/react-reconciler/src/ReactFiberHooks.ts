import { FiberNode } from './ReactFiber';

export function renderWithHooks(workInprogress: FiberNode) {
	const Component = workInprogress.type;
	const props = workInprogress.pendingProps;
	const children = Component(props);
	return children;
}
