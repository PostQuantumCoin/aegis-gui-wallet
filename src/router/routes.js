const routes = [
	{
		path: '/startup',
		component: () => import('layouts/StartupLayout.vue'),
	},
	{
		path: '/',
		component: () => import('layouts/MainLayout.vue'),
	},
	{
		path: '/:catchAll(.*)*',
		component: () => import('pages/ErrorNotFound.vue')
	}
]

export default routes
