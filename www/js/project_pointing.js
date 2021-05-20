project_pointing = _.clone(openerp);;
(function() {
'use strict';

    odoo_project_pointing_db(project_pointing); //Import db.js
    odoo_project_pointing_models(project_pointing); //Import model.js
    odoo_project_pointing_screens(project_pointing); // Import screens.js
    odoo_project_pointing_widgets(project_pointing); //Import widget.js
    odoo_project_pointing_utils(project_pointing); //Import utils.js

    project_pointing.App = (function() {
    
        function App($element) {
            this.initialize($element);
        }
        var templates_def = $.Deferred().resolve();
        App.prototype.add_template_file = function(template) {
            var def = $.Deferred();
            templates_def = templates_def.then(function() {
                openerp.qweb.add_template(template, function(err) {
                    if (err) {
                        def.reject(err);
                    } else {
                        def.resolve();
                    }
                });
                return def;
            });
            return def;
        };
        App.prototype.initialize = function($element) {
            this.$el = $element;
    
            var Connect = new XMLHttpRequest();
            // Define which file to open and
            // send the request.
            Connect.open("GET", "xml/project_pointing.xml", false);
            Connect.setRequestHeader("Content-Type", "text/xml");
            Connect.send(null);
     
            // Place the response in an XML document.
            var xml = Connect.responseXML;
    
            this.add_template_file(xml);
            this.pt_widget = new project_pointing.project_pointing_widget(null, {});
            this.pt_widget.appendTo($element);
        };
        return App;
    })();

    jQuery(document).ready(function() {
        var app = new project_pointing.App($(".odoo_project_pointing"));
    });
})();
