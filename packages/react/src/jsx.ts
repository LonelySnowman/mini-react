import { REACT_ELEMENT_TYPE, REACT_FRAGMENT_TYPE } from 'shared/ReactSymbols';
import {
	Type,
	Key,
	Ref,
	Props,
	ReactElementType,
	ElementType
} from 'shared/ReactTypes';

/**
 * @description 001 开始的起点 ReactElement 对象
 * @param type Element 类型
 * @param key Element 唯一 key
 * @param ref ref 绑定的值
 * @param props Element 上的 props
 */
const ReactElement = function (
	type: Type,
	key: Key,
	ref: Ref,
	props: Props
): ReactElementType {
	const element = {
		$$typeof: REACT_ELEMENT_TYPE,
		type,
		key,
		ref,
		props,
		__mark: 'KaSong'
	};
	return element;
};

export function isValidElement(object: any) {
	return (
		typeof object === 'object' &&
		object !== null &&
		object.$$typeof === REACT_ELEMENT_TYPE
	);
}

export const createElement = (
	type: ElementType,
	config: any,
	...maybeChildren: any
) => {
	let key: Key = null;
	const props: Props = {};
	let ref: Ref = null;

	for (const prop in config) {
		const val = config[prop];
		if (prop === 'key') {
			if (val !== undefined) {
				key = '' + val;
			}
			continue;
		}
		if (prop === 'ref') {
			if (val !== undefined) {
				ref = val;
			}
			continue;
		}
		if ({}.hasOwnProperty.call(config, prop)) {
			props[prop] = val;
		}
	}
	const maybeChildrenLength = maybeChildren.length;
	if (maybeChildrenLength) {
		if (maybeChildrenLength === 1) {
			props.children = maybeChildren[0];
		} else {
			props.children = maybeChildren;
		}
	}
	return ReactElement(type, key, ref, props);
};

export const Fragment = REACT_FRAGMENT_TYPE;

/**
 * @description 003 将解析后的 jsx 包装成函数并返回 ReactElement
 * @param type Element 类型
 * @param config 传入的 props
 * @param maybeKey
 */
export const jsx = (type: ElementType, config: any, maybeKey: any) => {
	// Element 的唯一 Key
	let key: Key = null;
	// Element ref
	let ref: Ref = null;
	// Element props
	const props: Props = {};
	if (maybeKey !== undefined) key = '' + maybeKey;
	for (const prop in config) {
		const val = config[prop];
		// 动态变化 key
		if (prop === 'key') {
			if (val !== undefined) key = '' + val;
			continue;
		}
		// ref 特殊判断
		if (prop === 'ref') {
			if (val !== undefined) ref = val;
			continue;
		}
		// 在自身的原型上进行 props 赋值
		if ({}.hasOwnProperty.call(config, prop)) {
			props[prop] = val;
		}
	}
	// 返回 ReactElement
	return ReactElement(type, key, ref, props);
};

// 开发环境与生产环境 jsx 一致
// 源码中 jsxDEV 会多一些开发环境校验
export const jsxDEV = jsx;
