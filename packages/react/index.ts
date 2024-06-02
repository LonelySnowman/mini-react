import { jsxDEV } from './src/ReactJSX';

export { createElement, isValidElement } from './src/ReactJSX';
import { Dispatcher, resolveDispatcher } from './src/ReactCurrentDispatcher';
import currentDispatcher from './src/ReactCurrentDispatcher';
export const version = '0.0.0';

export const useState: Dispatcher['useState'] = (initialState) => {
	const dispatcher = resolveDispatcher();
	return dispatcher.useState(initialState);
};

export const __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRE__ = {
	currentDispatcher
};

export default {
	version: '0.0.0',
	creatElement: jsxDEV
};
