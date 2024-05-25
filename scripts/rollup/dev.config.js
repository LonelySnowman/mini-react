import ReactConfig from './react.config';
import ReactDomConfig from './react-dom.config';

export default () => {
	return [...ReactDomConfig, ...ReactConfig];
};
