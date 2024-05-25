import path from 'path';
import fs from 'fs';

import ts from 'rollup-plugin-typescript2';
import cjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';

const pkgPath = path.resolve(__dirname, '../../packages'); // 源码包路径
const distPath = path.resolve(__dirname, '../../dist/node_modules'); // 产物包路径

/**
 * @description 获取
 * @param pkgName
 * @param isDist
 * @returns {string}
 */
export function resolvePkgPath(pkgName, isDist) {
	if (isDist) return `${distPath}/${pkgName}`;
	return `${pkgPath}/${pkgName}`;
}

/**
 * @description 获取 pkgName 下 package.json 后的解析对象
 * @param pkgName 包名称
 */
export function getPackageJSON(pkgName) {
	const path = `${resolvePkgPath(pkgName)}/package.json`;
	const str = fs.readFileSync(path, { encoding: 'utf-8' });
	return JSON.parse(str);
}

/**
 * @param alias 别名配置
 * @param typescript ts 插件配置
 */
export function getBaseRollupPlugins({
	alias = {
		__DEV__: true,
		preventAssignment: true
	},
	typescript = {}
} = {}) {
	// rollup 基本打包插件
	// replace 支持替换字符串
	// cjs 支持处理 commonjs 模块
	// ts 支持处理 typescript 模块
	return [replace(alias), cjs(), ts(typescript)];
}
