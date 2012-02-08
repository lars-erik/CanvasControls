(function (cc) {

	cc.timelinemodel = new Object();

	cc.timelinemodel.flattenModel = function (hierarchial) {
		var flattened = [];
		flatten([], hierarchial, flattened);
		return flattened;
	};

	cc.timelinemodel.findHierarchialFromFlat = function (hierarchial, flat) {
		for (var i = 0; i < flat.parents.length; i++) {
			hierarchial = $(hierarchial).filter(function () { return this.id == flat.parents[i]; })[0].children;
		}
		return $(hierarchial).filter(function () { return this.id == flat.id; })[0];
	};

	function flatten(parents, hierarchial, flattened) {
		for (var i = 0; i < hierarchial.length; i++) {
			if (hierarchial[i].expanded == undefined)
				hierarchial[i].expanded = false;
			var flat = createFlat(parents, hierarchial[i]);
			flattened.push(flat);
			if (hierarchial[i].expanded && hierarchial[i].children.length > 0) {
				var newParents = flat.parents.slice();
				newParents.push(flat.id),
				flatten(
					newParents,
					hierarchial[i].children,
					flattened
				);
			}
		}
	}

	function createFlat(parents, hierarchialElement) {
		return {
			id: hierarchialElement.id,
			label: hierarchialElement.title,
			timeline: hierarchialElement.timeline,
			hasChildren: hierarchialElement.hasChildren,
			parents: parents,
			expanded: hierarchialElement.expanded
		};
	}

})(canvascontrols);