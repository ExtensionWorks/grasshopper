/* global btoa */
/* global Tablesort */
/* global accounting */

(function() {
    'use strict';

    var CUSTOMER_URL = '%@/wc-api/v2/customers/email/%@?oauth_consumer_key=%@';
    var CUSTOMER_ORDER_URL = '%@/wc-api/v2/customers/%@/orders?oauth_consumer_key=%@';

    return {
        requests: {
            getCustomer: function(email){

                return {
                    headers: {
                        'Authorization': this.headers.authorization
                    },
                    url: helpers.fmt(CUSTOMER_URL, this.setting('woocommerce_url'), email,this.setting('woocommerce_api_consumer_key')),
                    method: 'GET',
                    proxy_v2: true
                };
            },
            getCustomerOrders: function(customer_id){
                return {
                    headers: {
                        'Authorization': this.headers.authorization
                    },
                    url: helpers.fmt(CUSTOMER_ORDER_URL, this.setting('woocommerce_url'), customer_id,this.setting('woocommerce_api_consumer_key')),
                    method: 'GET',
                    proxy_v2: true
                };
            }
        },

        events: {
            'app.activated': 'initialize',
            'app.willDestroy': 'cleanUp',
            'getCustomer.done': 'customerRetrieved',
            'getCustomer.fail': 'customerOrdersNone',
            'getCustomerOrders.done': 'customerOrdersRetrieved',
            'click .order_table tr.clickable': 'highlightRow',
            'click .gotoOrders': 'goToOrders',
            'click .badge a': 'slideToProducts',
        },

        initialize: function() {
	        //this.$('<script src="https://static.zdassets.com/zendesk_app_framework_sdk/2.0/zaf_sdk.min.js"></script>').appendTo('head');
            this.$('<script src="//cdnjs.cloudflare.com/ajax/libs/tablesort/1.6.1/tablesort.min.js">').appendTo('head');
            this.$('<script src="//cdnjs.cloudflare.com/ajax/libs/accounting.js/0.4.1/accounting.min.js">').appendTo('head');
            this.headers = {};
            this.headers.authorization = 'Basic ' + btoa(this.setting('woocommerce_api_consumer_key') + ':' + this.setting('woocommerce_api_consumer_secret'));
            this.showSpinner(true);
            this.ajax('getCustomer', this.ticket().requester().email());
        },
        
        //var client = ZAFClient.init();

        customerRetrieved: function(data){
            this.ajax('getCustomerOrders', data.customer.id);
        },

        customerOrdersRetrieved: function(data){
            //reset order cache
            this.cache = {};
            this.cache.orders = [];
            this.cache.total = 0;

            //reset the position
            this.slideOrders = false;

            if(data.orders.length > 0){
                this.buildOrderTable(data);
            } else {
                this.switchTo('errors', {error_no_orders: true});
            }
            this.showSpinner(false);
        },

        customerOrdersNone: function(){
            this.switchTo('errors', {error_no_customer: true});
            this.showSpinner(false);
        },

        buildOrderTable: function(orderData){
            var total = 0;
            var self = this;

            _.each(orderData.orders, function(order){
                self.cache.total += parseFloat(order.total);
                order.created_at = self.formatDate(order.created_at);
                order.total = accounting.formatMoney(order.total);

                // add to cache
                self.cache.orders.push(order);
            });

            this.goToOrders();
        },

        slideToProducts: function(e){
            var self = this;
            var parentRow = this.$(e.target).closest('tr');

            this.slideOrders = true;
            this.$('.order_table').animate({left: '-499px'}, 400, function(){
                var orderItems = self.cache.orders[parentRow.data('order-id')].line_items;
                self.goToProducts(orderItems);
            });
        },

        goToOrders: function(){
            this.$('.order_table').css({left: 'auto'});

            this.switchTo('order_table', {
                orders: this.cache.orders,
                num_orders: this.cache.orders.length,
                total: accounting.formatMoney(this.cache.total)
            });

            if(this.slideOrders === true){
                this.$('.order_table').css({opacity: 0, left: '-499px'});
                this.$('.order_table').css({opacity: 1});
                this.$('.order_table').animate({left: '0'}, 300);
            }

            new Tablesort(this.$('.order_table')[0]);
        },

        goToProducts: function(items){
            this.switchTo('products_table', {products: items});
            new Tablesort(this.$('.product_table')[0]);
        },

        highlightRow: function(e){
            var self = this;
            var parentRow = this.$(e.target).closest('tr');

            // remove highlight for all other rows
            parentRow.siblings().removeClass('success');

            // highlight clicked row
            parentRow.toggleClass('success');
        },

        formatDate: function(dateString){
            var date =  new Date(dateString);
            return date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
        },

        showSpinner: function(show) {
            if (show) {
                this.$('.main').addClass('loading');
                this.$('.loading_spinner').css('display', 'block');
            } else {
                this.$('.main').removeClass('loading');
                this.$('.loading_spinner').css('display', 'none');
            }
        }
    };

}());
