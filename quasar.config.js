const path = require('path');
const { configure } = require('quasar/wrappers');

module.exports = configure(function () {
	return {
		boot: [
			'i18n',
		],
		css: [
			'app.css',
			'icon.css',
			'color.css',
			'theme.css'
		],
		extras: [
			'roboto-font',
			'material-icons',
			'material-symbols-rounded',
			'line-awesome'
		],
		build: {
			target: {
				browser: ['es2020', 'chrome104'],
				node: 'node16'
			},
			vueRouterMode: 'hash',
			vitePlugins: [
				['@intlify/vite-plugin-vue-i18n', {
					include: path.resolve(__dirname, './src/i18n/**')
				}]
			]
		},
		devServer: {
			open: true
		},
		framework: {
			config: {},
			plugins: []
		},
		animations: [],
		electron: {
			inspectPort: 5860,
			bundler: 'packager',
			packager: {
				asar: {
					unpack: '{**/*.node,**/mineWin.exe,**/mineLinux}',
				},
				extraResource: []
			},
		}
	}
});
