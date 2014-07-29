/* global btoa */
/* global Tablesort */
/* global accounting */

(function() {
    'use strict';

    // var CUSTOMER_URL = '%@/wc-api/v1/customers/email/%@';
    var CUSTOMER_URL = '%@/wc-api/v1/customers/email/%@';
    var CUSTOMER_ORDER_URL = '%@/wc-api/v1/customers/%@/orders';

    return {
        requests: {
            getCustomer: function(email){
                return {
                    headers: {
                        'Authorization': this.headers.authorization
                    },
                    url: helpers.fmt(CUSTOMER_URL, this.setting('woocommerce_url'), email),
                    method: 'GET',
                    proxy_v2: true
                };
            },
            getCustomerOrders: function(customer_id){
                return {
                    headers: {
                        'Authorization': this.headers.authorization
                    },
                    url: helpers.fmt(CUSTOMER_ORDER_URL, this.setting('woocommerce_url'), customer_id),
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
            'getCustomerOrders.done': 'customerOrdersRetrieved'
        },

        initialize: function() {
            this.$('<script src="//cdnjs.cloudflare.com/ajax/libs/tablesort/1.6.1/tablesort.min.js">').appendTo('head');
            this.$('<script src="//cdnjs.cloudflare.com/ajax/libs/accounting.js/0.4.1/accounting.min.js">').appendTo('head');
            this.headers = {};
            this.headers.authorization = 'Basic ' + btoa(this.setting('woocommerce_api_consumer_key') + ':' + this.setting('woocommerce_api_consumer_secret'));
            this.showSpinner(true);
            this.ajax('getCustomer', this.ticket().requester().email());
        },

        customerRetrieved: function(data){
            this.ajax('getCustomerOrders', data.customer.id);
        },

        customerOrdersRetrieved: function(data){
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
            var orders = [];
            var total = 0;
            var self = this;

            _.each(orderData.orders, function(order){
                total += parseFloat(order.total);
                order.created_at = self.formatDate(order.created_at);
                orders.push(order);
                total += parseFloat(order.total)
            });

            this.switchTo('order_table', {
                orders: orders,
                num_orders: orders.length,
                total: accounting.formatMoney(total)
            });

            // add events to order table
            this.$('#order_table tr').click(function(){
                self.$(this).closest("tr").siblings().removeClass('selected');
                self.$(this).toggleClass('selected');
            });
            new Tablesort(this.$('#order_table')[0]);
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
