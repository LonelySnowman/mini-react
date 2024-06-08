// 事件系统

import { Container } from 'hostConfig';
import { Props } from 'shared/ReactTypes';

export const elementPropsKey = '__props';

const validEventTypeList = ['click'];

export interface DOMElement extends Element {
	[elementPropsKey]?: string;
}

type EventCallBack = (e: Event) => void;

interface Paths {
	capture: EventCallBack[];
	bubble: EventCallBack[];
}

interface SynctheticEvent extends Event {
	__stopPropagation: boolean; // 阻止事件冒泡
}

export function updateFiberProps(node: DOMElement, props: Props) {
	node[elementPropsKey] = props;
}

export function initEvent(container: Container, eventType: string) {
	if (!validEventTypeList.includes(eventType)) {
		console.warn(`当前不支持 ${eventType} 事件`);
		return;
	}
	if (__DEV__) {
		console.log(`初始化事件 ${eventType}`);
	}
	container.addEventListener(eventType, (e) => {
		dispatchEvent(container, eventType, e);
	});
}

function dispatchEvent(container: Container, eventType: string, e: Event) {
	const targetElement = e.target;

	if (targetElement === null) {
		console.warn(`事件不存在 target ${e}`);
		return;
	}

	// 1.收集沿途的事件
	const { bubble, capture } = collectPaths(targetElement as DOMElement, container, eventType);
	// 2.构造合成事件
	const synctheticEvent = createSyntheticEvent(e);
	// 3.遍历 capture 捕获阶段
	triggerEventFlow(capture, synctheticEvent);
	if (!synctheticEvent.__stopPropagation) {
		// 4.遍历 bubble 冒泡阶段
		triggerEventFlow(bubble, synctheticEvent);
	}
	
}

function getEventCallbackNameFromEventType(
	eventType: string
): string[] | undefined {
	return {
		click: ['onClickCapture', 'onClick']
	}[eventType];
}

function collectPaths(targetElement: DOMElement, container: Container, eventType: string) {
	const path: Paths = {
		capture: [],
		bubble: []
	};
	// container 进行事件代理从底部到 container 进行事件收集
	while (targetElement && targetElement !== container) {
		// 收集
		const elementProps = targetElement[elementPropsKey];
		if (elementProps) {
			// click -> onClickCapture onCLick
			const callbackNameList = getEventCallbackNameFromEventType(eventType);			
			if (callbackNameList) {
				callbackNameList.forEach((callbackName, i) => {
					// @ts-ignore
					const eventCalback = elementProps[callbackName];
					// 使用 unshift 与 push 符合捕获与冒泡机制按顺序触发
					if (eventCalback) {
						if (i === 0) {
							path.capture.unshift(eventCalback);
						} else {
							path.bubble.push(eventCalback);
						}
					}
				})
			}
		}
		targetElement = targetElement.parentNode as DOMElement;
	}
	return path;
}

// 赋予模拟的是否阻止事件冒泡的状态
function createSyntheticEvent(e: Event): SynctheticEvent {
	const synctheticEvent = e as SynctheticEvent;
	synctheticEvent.__stopPropagation = false;
	const originStopPropagation = e.stopPropagation;
	// 对原生方法进行覆写(添加了内部的标记变更)
	synctheticEvent.stopPropagation = () => {
		synctheticEvent.__stopPropagation = true;
		if (originStopPropagation) {
			originStopPropagation();
		}
	}
	return synctheticEvent;
}

function triggerEventFlow(paths: EventCallBack[], synctheticEvent: SynctheticEvent) {
	for (let i=0; i<paths.length; i++) {
		const callback = paths[i];
		callback.call(null, synctheticEvent);
		if (synctheticEvent.__stopPropagation) break; // 阻止事件传递
	}
}
