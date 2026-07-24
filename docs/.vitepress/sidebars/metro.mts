export default [
    {text: '无锡地铁', items: [
        { text: '引言', link: '/metro/metro_index/index.md' },
        { text: '线路图' , link: '/metro/map/index.md' },
        { text: '已有线路', collapsed: true, items: [
            {text: '1号线', collapsed: true, items: [
                { text: '1号线简介', link: '/metro/line_1_intro/index.md' },
                { text: '1号线站点明细', link: '/metro/line_1_station/index.md' },
            ]},
            { text: '2号线', collapsed: true, items: [
                { text: '2号线简介', link: '/metro/line_2_intro/index.md' },
                { text: '2号线站点明细', link: '/metro/line_2_station/index.md' },
            ]},
            { text: '3号线', collapsed: true, items: [
                { text: '3号线简介', link: '/metro/line_3_intro/index.md' },
                { text: '3号线站点明细', link: '/metro/line_3_station/index.md' },
            ]},
            { text: '4号线', collapsed: true, items: [
                { text: '4号线简介', link: '/metro/line_4_intro/index.md' },
                { text: '4号线站点明细', link: '/metro/line_4_station/index.md' },
            ]},
            { text: 'S1线', collapsed: true, items: [
                { text: 'S1线简介', link: '/metro/line_S1_intro/index.md' },
                { text: 'S1线站点', link: '/metro/line_S1_station/index.md' },
            ]},
        ]},
        { text: '建设线路', collapsed: true, items: [
            {text: '建设线路简介', link: '/metro/constructing_index/index.md' },
            {text: '4号线二期工程', collapsed: true, items: [
                {text: '4号线二期工程简介', link: '/metro/line_4_partII_intro/index.md'},
                {text: '4号线二期工程站点', link: '/metro/line_4_partII_station/index.md'},
            ]},
            {text: '5号线', collapsed: true, items: [
                { text: '5号线简介', link: '/metro/line_5_intro/index.md' },
                { text: '5号线站点', link: '/metro/line_5_station/index.md' },
            ]},
            { text: '6号线', collapsed: true, items: [
                { text: '6号线简介', link: '/metro/line_6_intro/index.md' },
                { text: '6号线站点', link: '/metro/line_6_station/index.md' },
            ]},
            { text: 'S2线', collapsed: true, items: [
                { text: 'S2线简介', link: '/metro/line_S2_intro/index.md' },
                { text: 'S2线站点', link: '/metro/line_S2_station/index.md' },
            ]},
        ]},
        { text: '规划线路', collapsed: true, items: [
            { text: '规划线路简介', link: '/metro/planning_index/index.md' },
            { text: '远期规划7号线', link: '/metro/far_future_line_7/index.md' },
            { text: '远期规划8号线', link: '/metro/far_future_line_8/index.md' },
            { text: '其它远期规划', link: '/metro/other_far_future/index.md' },
            ]},
    ],},
]