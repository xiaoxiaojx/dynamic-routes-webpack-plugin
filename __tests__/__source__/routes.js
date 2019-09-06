const routes = [
    {
      name: "主页",
      path: "/home",
      load: () => import(/* webpackChunkName: 'home' */ "../components/Page/Home")
    },
    {
      name: "举报",
      path: "/report",
      load: () =>
        import(/* webpackChunkName: 'report' */ "../components/Page/Report")
    },
    {
      path: "/edit",
      load: () => import(/* webpackChunkName: 'edit' */ "../components/Page/Edit")
    },
    {
      path: "/success",
      load: () =>
        import(/* webpackChunkName: 'edit' */ "../components/Page/Success")
    }
  ];
  
  export default routes;
  