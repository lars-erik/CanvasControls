(function (cc) {

	cc.TreeDataSource = Class.extend({
		init: function (queue) {
			this.queue = queue;
		},
		load: function (model, callback) {
			
		},
		add: function (model, callback) {
			var data = model != null ? {
				InitiativeId: model.initiativeId,
				Period: model.start + "-" + model.end,
				Start: model.start.getTime(),
				End: model.end.getTime()
			} : {};
			
		},
		addTo: function (parentModel, callback) {
			var data = {};
			if (parentModel != null)
				data.ParentId = parentModel.Id;
			
		},
		addDone: function (data, textStatus, jqXHR, extra) {
			extra.dsCallback(data);
		},
		update: function (model, callback) {
			model.Name = model.label;
			
		},
		remove: function (model, callback) {
			
		}
	});
})(canvascontrols);