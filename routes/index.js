/*
 * GET home page.
 */

exports.index = function(req, res) {

    if (!process.env.VCAP_APP_PORT) {
        res.render('index', {
            error: "This app is not running a Stackato environment"
        });
    } else {

        if (!process.env.STACKATO_SERVICES) {
            console.error("No services are bound to this app")
        } else {
            services = JSON.parse(process.env.STACKATO_SERVICES);
        }

        res.render('index', {
            services: services
        });

    }

};
