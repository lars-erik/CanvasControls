(function(cc) {

	cc.BoardDataSource = Class.extend({
		init: function(queue) {
			this.queue = queue;
		},
		loadAll: function (model, treeNode, callback) {
			var data = model != null ? { InitiativeId: model.Id} : {};
			
		},

		add: function (model, callback) {
			var data = model != null ? {
				InitiativeId: model.treeId,
				Period: model.start + "-" + model.end,
				Start: model.start.getTime(),
				End: model.end.getTime()
			} : {};

			
		},

		update: function (model, node, callback) {

			var kpis = $.map(model.kpis, function (e) {
				return { Value: e.value, From: e.start, Id: e.id, To: e.end, Type: e.type };
			});
			var data = {
				Id: model.id,
				InitiativeId: model.treeId,
				From: model.start.getTime(),
				To: model.end.getTime(),
				//Kpis: [{ Id: "a", Value: 1.00, Type: "b" }, { Id: "c", Value: 2.5, Type: "d"}]
				Kpis: kpis
			};

			
			
		},

		remove: function (model, callback) {
			var data = {
				Id: model.id,
				InitiativeId: model.treeId
			};

			
		}
	});
})(canvascontrols);