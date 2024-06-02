import {
	createElement as createElementFn,
	isValidElement as isValidElementFn,
	jsxDEV
} from './src/ReactJSX';
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

export const createElement = createElementFn;
export const isValidElement = isValidElementFn;

export default {
	version: '0.0.0',
	creatElement: jsxDEV
};
