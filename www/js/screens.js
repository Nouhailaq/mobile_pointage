function odoo_project_pointing_screens(project_pointing) {

    var QWeb = openerp.qweb,
    _t = openerp._t;

    //Move it in lib code, may be in openerpframework.js
    $.fn.openerpClass = function(additionalClass) {
        // This plugin should be applied on top level elements
        additionalClass = additionalClass || '';
        if (!!$.browser.msie) {
            additionalClass += ' openerp_ie';
        }
        return this.each(function() {
            $(this).addClass('openerp ' + additionalClass);
        });
    };

    var messages_by_seconds = function() {
        return [
            [0, _t("Loading...")],
            [20, _t("Still loading...")],
            [60, _t("Still loading...<br />Please be patient.")],
            [120, _t("Don't leave yet,<br />it's still loading...")],
            [300, _t("You may not believe it,<br />but the application is actually loading...")],
            [420, _t("Take a minute to get a coffee,<br />because it's loading...")],
            [3600, _t("Maybe you should consider reloading the application by pressing F5...")]
        ];
    };

    //Block UI Stuff
    project_pointing.Throbber = openerp.Widget.extend({
        template: "Throbber",
        start: function() {
            var opts = {
              lines: 13, // The number of lines to draw
              length: 7, // The length of each line
              width: 4, // The line thickness
              radius: 10, // The radius of the inner circle
              rotate: 0, // The rotation offset
              color: '#FFF', // #rgb or #rrggbb
              speed: 1, // Rounds per second
              trail: 60, // Afterglow percentage
              shadow: false, // Whether to render a shadow
              hwaccel: false, // Whether to use hardware acceleration
              className: 'spinner', // The CSS class to assign to the spinner
              zIndex: 2e9, // The z-index (defaults to 2000000000)
              top: 'auto', // Top position relative to parent in px
              left: 'auto' // Left position relative to parent in px
            };
            this.spin = new Spinner(opts).spin(this.$el[0]);
            this.start_time = new Date().getTime();
            this.act_message();
        },
        act_message: function() {
            var self = this;
            setTimeout(function() {
                if (self.isDestroyed())
                    return;
                var seconds = (new Date().getTime() - self.start_time) / 1000;
                var mes;
                _.each(messages_by_seconds(), function(el) {
                    if (seconds >= el[0])
                        mes = el[1];
                });
                self.$(".oe_throbber_message").html(mes);
                self.act_message();
            }, 1000);
        },
        destroy: function() {
            if (this.spin)
                this.spin.stop();
            this._super();
        },
    });
    project_pointing.Throbber.throbbers = [];
    
    project_pointing.blockUI = function() {
        var tmp = $.blockUI.apply($, arguments);
        var throbber = new project_pointing.Throbber();
        project_pointing.Throbber.throbbers.push(throbber);
        throbber.appendTo($(".oe_blockui_spin_container"));
        return tmp;
    };
    project_pointing.unblockUI = function() {
        _.each(project_pointing.Throbber.throbbers, function(el) {
            el.destroy();
        });
        return $.unblockUI.apply($, arguments);
    };

    var opened_modal = [];
    

    project_pointing.ScreenSelector = openerp.Class.extend({
        init: function(options){
            this.project_pointing_model = options.project_pointing_model;

            this.screen_set = options.screen_set || {};

            this.default_screen = options.default_screen;

            this.current_screen = null; 

            for(screen_name in this.screen_set){
                this.screen_set[screen_name].hide();
            }

        },
        add_screen: function(screen_name, screen){
            screen.hide();
            this.screen_set[screen_name] = screen;
            return this;
        },
        set_current_screen: function(screen_name, screen_data_set, params, refresh, re_render) {
            var screen = this.screen_set[screen_name];
            if(re_render) {
                screen.renderElement();
            }
            if(!screen){
                console.error("ERROR: set_current_screen("+screen_name+") : screen not found");
            }

            var old_screen_name = this.project_pointing_model.get_screen_data('screen');

            this.project_pointing_model.set_screen_data('screen', screen_name);

            if(params){
                this.project_pointing_model.set_screen_data('params', params);
            }

            if( screen_name !== old_screen_name ){
                this.project_pointing_model.set_screen_data('previous-screen',old_screen_name);
            }

            if ( refresh || screen !== this.current_screen){
                if(this.current_screen){
                    this.current_screen.close();
                    this.current_screen.hide();
                }
                this.current_screen = screen;
                this.current_screen.show();
                if(screen_data_set && this.current_screen.set_screen_values) {
                    this.current_screen.set_screen_values(screen_data_set);
                }
            }
        },
        get_current_screen: function(){
            return this.project_pointing_model.get_screen_data('screen') || this.default_screen;
        },
        back: function(){
            var previous = this.project_pointing_model.get_screen_data('previous-screen');
            if(previous){
                this.set_current_screen(previous);
            }
        },
        get_current_screen_param: function(param){
            var params = this.project_pointing_model.get_screen_data('params');
            return params ? params[param] : undefined;
        },
        set_screen_values: function() {
            //void method, child will implement if needed
        },
        set_default_screen: function(){
            this.set_current_screen(this.default_screen);
        },
    });

    project_pointing.ScreenWidget = openerp.Widget.extend({ //Make sure we need to extend project_pointing_widget or openerp.widget
        init: function(parent,options){
            this._super(parent,options);
            this.hidden = false;
            this.project_pointing_model = project_pointing.project_pointing_model;
            this.project_pointing_db = this.project_pointing_model.project_pointing_db;
        },
        // this method shows the screen and sets up all the widget related to this screen. Extend this method
        // if you want to alter the behavior of the screen.
        show: function(){
            var self = this;

            this.hidden = false;
            if(this.$el){
                this.$el.removeClass('o_hidden');
            }
        },

        // this method is called when the screen is closed to make place for a new screen. this is a good place
        // to put your cleanup stuff as it is guaranteed that for each show() there is one and only one close()
        close: function(){
            //TO Implement
        },

        hide: function() {
            //this methods hides the screen.
            this.hidden = true;
            if(this.$el){
                this.$el.addClass('o_hidden');
            }
        },
        renderElement: function(){
            this._super();
            if(this.hidden){
                if(this.$el){
                    this.$el.addClass('o_hidden');
                }
            }
        },
        rpc_error: function(error) {
            if (error.data.exception_type === "except_osv" || error.data.exception_type === "warning" || error.data.exception_type === "access_error") {
                this.show_warning(error);
            } else {
                this.show_error(error);
            }
        },
        show_warning: function(error) {
            var self = this;
            if (error.data.exception_type === "except_osv") {
                error = _.extend({}, error, {data: _.extend({}, error.data, {message: error.data.arguments[0] + "\n\n" + error.data.arguments[1]})});
            }
            new project_pointing.Dialog(this, {
                size: 'medium',
                title: "Odoo " + (_.str.capitalize(error.type) || "Warning"),
                buttons: [
                    {text: _t("Ok"), click: function() { $("body").find('.modal').modal('hide'); }}
                ],
            }, $('<div>' + QWeb.render('ProjectPointing.warning', {error: error}) + '</div>')).open();
        },
        show_error: function(error) {
            var self = this;
            var buttons = {};
            buttons[_t("Ok")] = function() {
                $("body").find('.modal').modal('hide');
            };
            new project_pointing.Dialog(this, {
                title: "Odoo " + _.str.capitalize(error.type),
                buttons: buttons
            }, QWeb.render('ProjectPointing.error', {widget: this, error: error})).open();
        },
    });

    project_pointing.ActivityScreen = project_pointing.ScreenWidget.extend({
        template: "ActivityScreen",
        events: {
            "click .pt_timer_button button": "on_timer",
            "click .activity_row": "on_row_click",
            "click .scan": "on_scan",
            "click .display": "on_display",

        },
        on_scan: function() {
                if(localStorage.getItem("LocalData") == null)
                {
                    var data = [];
                    data = JSON.stringify(data);
                    localStorage.setItem("LocalData", data);
                }
                cordova.plugins.barcodeScanner.scan(
                function (result) {
                    if(!result.cancelled)
                    {
                        navigator.notification.prompt("Please enter name of data",  function(input){
                            var name = input.input1;
                            var value = result.text;
                            var currentdate = new Date(); 
                            var datetime =  currentdate.getDate() + "/"
                                            + (currentdate.getMonth()+1)  + "/" 
                                            + currentdate.getFullYear() + " @ "  
                                            + currentdate.getHours() + ":"  
                                            + currentdate.getMinutes() + ":" 
                                            + currentdate.getSeconds(); 
                            var data = localStorage.getItem("LocalData");
                            console.log(data);
                            data = JSON.parse(data);
                            data[data.length] = [name, value, datetime];

                            localStorage.setItem("LocalData", JSON.stringify(data));

                            alert("Done");
                        });
                        
                    }
                },
                function (error) {
                    alert("Scanning failed: " + error);
                }
           );
        },
        on_display: function() {
            $("table#allTable tbody").empty();

            var data = localStorage.getItem("LocalData");
            console.log(data);
            data = JSON.parse(data);
            alert(data)

            var html = "";

            for(var count = 0; count < data.length; count++)
            {
                html = html + "<tr><td>" + data[count][0] + "</td><td>" + data[count][1] + "</td><td>" + data[count][2] + "</td></tr>";
            }

            $("table#allTable tbody").append(html).closest("table#allTable").table("refresh").trigger("create");
        },
        init: function(project_pointing_widget, options) {
            this._super.apply(this, arguments);
            this.project_pointing_widget = project_pointing_widget;
            this.activities = [];
        },
        show: function() {
            var self = this;
            this._super();
            this.activity_list = new project_pointing.ActivityListView();
            this.activity_list.appendTo(this.$el.find(".pt_activity_body"));

            //Add, Add Activity row after activities listview
            
            this.$el.find(".pt_stat").on("click", function() {
                self.project_pointing_widget.screen_selector.set_current_screen("stat", {}, {}, true, true);
            });
            this.$el.find(".pt_sync").on("click", function() {
                self.project_pointing_widget.screen_selector.set_current_screen("sync", {}, {}, false, true);
            });
            

            var data = localStorage.getItem("LocalData");
            console.log(data);
            data = JSON.parse(data);
            var html = "";

            for(var count = 0; count < data.length; count++)
            {
                html = html + "<tr><td>" + data[count][0] + "</td><td>" + data[count][1] + "</td><td>" + data[count][2] + "</td></tr>";
            }

            $("table#allTable tbody").append(html).closest("table#allTable").table("refresh").trigger("create");

        },
        hide: function() {
            if(this.activity_list) {
                this.activity_list.destroy();
            }
            if (this.project_m2o) {
                this.project_m2o.destroy();
            }
            if (this.task_m2o) {
                this.task_m2o.destroy();
            }
            if (this.intervalTimer) { clearInterval(this.intervalTimer);}
            this._super();
        },
        pad_table_to: function(count) {
            if (this.activity_list.activities.length >= count) {
                return;
            }
            var row = '<tr class="activity_row"><td></td></tr>';
            $rows = $(new Array(count - this.activity_list.activities.length + 1).join(row));
            if (!this.$el.find(".activity_row").length) {
                $rows.appendTo(this.$el.find(".pt_activity_body > table > tbody").parent());
            } else {
                $rows.appendTo(this.$el.find(".activity_row:last").parent());
            }
        },
        
        get_pending_lines: function() {
            return this.project_pointing_model.get_pending_records();
        },
        get_total: function() {
            if (!this.activity_list.get_total()) {
                return;
            }
            var duration = this.activity_list.get_total();
            return _.str.sprintf("%s:%02d", duration[0], (duration[1] || 0));
        },
       
        
        //Duplicate method same as Add Activity screen
        set_project_model: function() {
            var project_id = this.project_m2o.get('value');
            var projects_collection = this.project_pointing_model.get('projects');
            var project_model = projects_collection.get(project_id);
            this.task_m2o.model = project_model;
        },
        
        get_sync_label: function() {
            return project_pointing.get_sync_label();
        },
    });

    project_pointing.AddActivityScreen = project_pointing.ScreenWidget.extend({
        template: "AddActivityScreen",
        events: {
            "click .pt_btn_add_activity": "on_activity_add",
            "click .pt_btn_edit_activity": "on_activity_edit",
            "click .pt_btn_remove_activity": "on_activity_remove",
            
        },
        
        init: function(project_pointing_widget, options) {
            this._super.apply(this, arguments);
            this.mode = options.mode || 'create';
            this.current_id = null;
            this.project_pointing_widget = project_pointing_widget;
        },
        
    });

    project_pointing.SyncScreen = project_pointing.ScreenWidget.extend({
        template: "SyncScreen",
        events: {
            "click .pt_btn_logout": "on_logout",
            "click .pt_btn_cancel": "on_cancel",
            "click .pt_btn_synchronize_existing_account": "on_sync",
            "click .pt_btn_synchronize": "on_authenticate_and_sync",
        },
        init: function(project_pointing_widget, options) {
            this._super.apply(this, arguments);
            this.project_pointing_widget = project_pointing_widget;
        },
        start: function() {
            this._super.apply(this, arguments);
        },
        show: function() {
            var self = this;
            this._super();
            this.$el.find(".pt_select_protocol").on("click", function() {
                self.$el.find(".pt_button_protocol span:first").text($(this).text());
            });
            this.$el.find("#pt_new_user").on("click", function() {
                self.$el.find(".o_new_account").addClass("o_active");
                self.$el.find(".o_existing_account").removeClass("o_active");
            });
            this.$el.find("#pt_existing_user").on("click", function() {
                self.$el.find(".o_new_account").removeClass("o_active");
                self.$el.find(".o_existing_account").addClass("o_active");
            });
        },
        on_cancel: function() {
            this.project_pointing_widget.screen_selector.set_current_screen("activity");
        },

        renderElement: function() {
            this.replaceElement(QWeb.render(this.template, {widget: this, project_pointing: project_pointing}));
        },
        on_authenticate_and_sync: function() {
            var self = this;
            var def = $.Deferred();
            console.log(def)
            var protocol = self.$el.find(".pt_button_protocol span:first").text();
            var origin = protocol + this.$el.find(".pt_input_server_address").val(); //May be store origin in localstorage to keep session persistent for that origin
            var db = this.$el.find(".pt_input_db").val();
            var username = this.$el.find(".pt_input_username").val();
            var password = this.$el.find(".pt_input_password").val();
            if(!_.all([origin, db, username, password])) {
                this.set_required();
                return;
            }
            //TODO: Check whether we already having session, if yes then use it by just reloading session
            var session = new openerp.Session(undefined, origin, {use_cors: true});
            project_pointing.session = session;
            console.log(session)
            session.session_authenticate(db, username, password).done(function() {
                //TODO: Create generic method set_cookie
                document.cookie = ["session_id="+session.session_id,'path='+origin,
                     'max-age=' + (24*60*60*365),
                     'expires=' + new Date(new Date().getTime() + 300*1000).toGMTString()].join(';');

                    //Store session object in local storage, we need it, so that user don't have to enter login detail each time while sync
                    //Note that, session_id is created new each time for cross domain policy
                self.project_pointing_db.save("session", session);
            }).fail(function(error, event) {
                if (error) {
                    self.rpc_error(error);
                } else {
                    alert("Something went wrong, please check your username or password");
                }
            });
            console.log(project_pointing.session);
            console.log(username);
            $.when(def).done(function() {
                console.log("You can go ahead to sync data and retrieve data");
                //Get Model data and sync with Server and then Retrieve data and store in localstorage
                self.on_sync();
            });
        },
        on_logout: function() {
            //TODO: Close the project_pointing_session(write session state to closed), then when same user access project timesheet next time he will be given new session
            var self = this;
            var def = $.Deferred();
            this.project_pointing_model.save_to_server().done(function() {
                if (!_.isEmpty(self.project_pointing_db.get_project_pointing_session())) {
                    def = self.project_pointing_model.close_project_pointing_session();
                } else {
                    def.resolve().promise();
                }
                
            });
            
        },
        on_sync: function() {
            var self = this;
            this.project_pointing_model.save_to_server().done(function() { //May be use always
                self.project_pointing_widget.screen_selector.set_current_screen("activity", {}, {}, false, true);
            });
        },
        set_required: function() {
            var origin = this.$el.find(".pt_input_server_address"); //May be store origin in localstorage to keep session persistent for that origin
            var db = this.$el.find(".pt_input_db");
            var username = this.$el.find(".pt_input_username");
            var password = this.$el.find(".pt_input_password");
            var first_elem = _.find([origin, db, username, password], function(ele) {return !ele.val();});
            first_elem.focus();
            _([origin, db, username, password]).each(function($element) {
                $element.removeClass('oe_form_required');
                if (!$element.val()) {
                    $element.addClass('pt_invalid');
                }
            });
            
        },
    });

    project_pointing.StatisticScreen = project_pointing.ScreenWidget.extend({
        template: "StatisticScreen",
        
        init: function(project_pointing_widget, options) {
            this._super.apply(this, arguments);
            this.project_pointing_widget = project_pointing_widget;
            this.week_index = 0;
        },
       
        get_pending_lines: function() {
            return this.project_pointing_model.get_pending_records();
        },
        get_sync_label: function() {
            return project_pointing.get_sync_label();
        },
    });
}