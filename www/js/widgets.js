function odoo_project_pointing_widgets(project_pointing) {
    //var QWeb = openerp.qweb,
    var QWeb = project_pointing.qweb,
    _t = openerp._t;

    project_pointing.project_pointing_widget = openerp.Widget.extend({
        template: "ProjectPointing",
        init: function() {
            this._super.apply(this, arguments);
            project_pointing.project_pointing_model = new project_pointing.project_pointing_model({project_pointing_widget: this}); //May be store in this, we'll not have session initially, need to discuss how to manage session
        },
        start: function() {
            var self = this;
            this._super.apply(this, arguments);
            $.when(project_pointing.project_pointing_model.ready).always(function() {
                self.build_widgets();
                self.screen_selector.set_default_screen();
            });
        },
        build_widgets: function() {
            //Creates all widgets instances and add into this object
            /*----------------Screen------------------*/
            this.activity_screen = new project_pointing.ActivityScreen(this, {project_pointing_model: project_pointing.project_pointing_model});
            //Append all screen widget in screen element of this.$el, by default all will be hidden and then current screen will be visible
            this.activity_screen.appendTo(this.$('.screens'));

            this.add_activity_screen = new project_pointing.AddActivityScreen(this, {project_pointing_model: project_pointing.project_pointing_model});
            this.add_activity_screen.appendTo(this.$('.screens'));

            this.sync_screen = new project_pointing.SyncScreen(this, {project_pointing_model: project_pointing.project_pointing_model});
            this.sync_screen.appendTo(this.$('.screens'));

            this.stat_screen = new project_pointing.StatisticScreen(this, {project_pointing_model: project_pointing.project_pointing_model});
            this.stat_screen.appendTo(this.$('.screens'));

            /*----------------Screen Selector------------------*/
            //TODO: change activity screen to activity_list and add_activity to simply activity for proper naming convention
            this.screen_selector = new project_pointing.ScreenSelector({
                project_pointing_model: project_pointing.project_pointing_model,
                screen_set:{
                    'activity': this.activity_screen,
                    'sync' : this.sync_screen,
                    'add_activity': this.add_activity_screen,
                    'stat' : this.stat_screen,
                },
                default_screen: 'activity',
            });
        },
    });

    

    project_pointing.ActivityListView = openerp.Widget.extend({
        template: "ActivityList",
        init: function() {
            this._super.apply(this, arguments);
            this.project_pointing_model = project_pointing.project_pointing_model;
            this.project_pointing_db = this.project_pointing_model.project_pointing_db;
            this.activities = [];
        },
        start: function() {
            this._super.apply(this, arguments);
            this.$(".pt_error").popover({
                'placement': 'auto top',
                'container': this.$el,
                'html': true,
                'trigger': 'hover',
                'animation': false,
                'toggle': 'popover',
                'delay': {'show': 300, 'hide': 100}
            });
        },
        renderElement: function() {
            this.activities = this.project_pointing_db.get_activities();
            this.activities = _.filter(this.activities, function(activity) {return activity.command != 2;});
            this.replaceElement(QWeb.render(this.template, {widget: this, activities: this.activities}));
        },
        format_duration: function(field_val) {
            return project_pointing.format_duration(field_val);
        },
        get_total: function() {
            var total = 0;
            _.each(this.activities, function(activity) { total += activity.unit_amount;});
            return this.format_duration(total);
        }
    });

}