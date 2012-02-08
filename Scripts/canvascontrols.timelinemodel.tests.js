/// <reference path="jquery-1.7.1.js"/>
/// <reference path="canvascontrols.js"/>
/// <reference path="canvascontrols.timelinemodel.js"/>

module("canvascontrols.timelinemodel", {
	setup: function() {

	},
	teardown: function() {

	}
});

test("can flatten hierarchial model", function () {
	var hierarchial = createInitialModel();
	var flat = canvascontrols.timelinemodel.flattenModel(hierarchial);
	equals(2, flat.length);
	equals("1", flat[0].id);
	equals("5", flat[1].id);
	
	/*
	equals(flat.length, 5);
	equals(hierarchial[1].timeline, flat[4].timeline);
	equals(2, flat[2].parents.length);
	equals("1", flat[2].parents[0]);
	equals("2", flat[2].parents[1]);
	*/
});

test("can find hierarchial element from flat", function () {
	var hierarchial = createInitialModel();
	hierarchial[0].expanded = true;
	hierarchial[0].children[0].expanded = true;
	var flat = canvascontrols.timelinemodel.flattenModel(hierarchial);
	equals(5, flat.length);
	equals(
		canvascontrols.timelinemodel.findHierarchialFromFlat(hierarchial, flat[2]),
		hierarchial[0].children[0].children[0]
	);
});

test("adds expand state to hierarchial element", function () {
	var hierarchial = createInitialModel();
	hierarchial[0].expanded = true;
	canvascontrols.timelinemodel.flattenModel(hierarchial);
	equals(true, hierarchial[0].expanded);
	equals(false, hierarchial[1].expanded);
});

function createInitialModel() {
	return [
		{
			id: "1",
			title: "box 1",
			hasChildren: true,
			timeline: [
					{ label: "hei hei", start: new Date(2012, 2, 1), end: new Date(2012, 4, 15, 23, 59, 59) },
					{ label: "hei hei", start: new Date(2012, 6, 10), end: new Date(2012, 7, 20, 23, 59, 59) }
				],
			children: [
				{
					id: "2",
					title: "box 1.1",
					hasChildren: true,
					children: [
						{
							id: "3",
							title: "box 1.1.1",
							haschildren: false,
							children: []
						}
					]
				},
				{
					id: "4",
					title: "box 1.2",
					hasChildren: true,
					children: []
				}
			]
		},
		{
			id: "5",
			title: "box 2",
			hasChildren: true,
			timeline: [
					{ label: "hei hei", start: new Date(2011, 10, 1), end: new Date(2012, 10, 31, 23, 59, 59) },
					{ label: "hei hei", start: new Date(2011, 6, 10), end: new Date(2011, 7, 20, 23, 59, 59) }
				],
			children: []
		}
	];
}