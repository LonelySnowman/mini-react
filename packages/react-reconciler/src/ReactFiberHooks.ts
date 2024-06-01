import { FiberNode } from './ReactFiber';

export function renderWithHooks(workInProgress: FiberNode) {
	const Component = workInProgress.type;
	const props = workInProgress.pendingProps;
	const children = Component(props);
	return children;
}
