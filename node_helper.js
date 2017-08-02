'use strict';

/* Magic Mirror
 * Module: MMM-Hive
 *
 * By Stuart McNally
 * MIT Licensed.
 */

const NodeHelper = require('node_helper');
var request = require('request');

module.exports = NodeHelper.create({

	start: function() {
		var self = this;
		console.log("Starting node helper for: " + this.name);

		this.config = null;
	},

	getData: function() {
		var self = this;
		
		var oUrl = this.config.outsideUrl;
		var iUrl = this.config.insideUrl;
		var myPostcode = this.config.postcode;
		var myHiveUser = this.config.username;
		var myHivePassword = this.config.password;
		var myHeaders = this.config.hiveHeaders;
		var sessionID;
		
		var body = {
        sessions: [{
          username: myHiveUser,
          password: myHivePassword,
          caller: 'WEB'
				}]
		};

		request({
			url: oUrl + myPostcode,
			method: 'GET',
		}, function (error, response, body) {
			if (response && response.statusCode) {
				if (!error && response.statusCode == 200) {
					self.sendSocketNotification("OUTSIDE", body);
					}
				else if (response.statusCode == 400) {
					self.sendSocketNotification("POSTCODE_ERROR", "Postcode missing or incorrect: " + response.statusCode + " Body: " + body);
					}
				else {
					self.sendSocketNotification("OUTSIDE_ERROR", "Error in request for Outside temperature with status code: " + response.statusCode + " Body: " + body);
					}
				}
			else {
			self.sendSocketNotification("UNKNOWN_ERROR", "Error found within get postcode data: " + response + " Body: " + body);
			}
		});

		request({
			url: iUrl + "/auth/sessions",
			headers: myHeaders,
			method: "POST",
			body: JSON.stringify(body),
		}, function (error, response, body) {
			if (response && response.statusCode) {
				if (!error && response.statusCode == 200) {
					var responseJson = JSON.parse(body);
					sessionID = responseJson.sessions[0].sessionId;
				}
				else if (response.statusCode == 400) {
					self.sendSocketNotification("400_ERROR", "Authorisation error username / password missing or incorrect: " + response.statusCode + " Body: " + body);
				}
				else {
					self.sendSocketNotification("INSIDE_ERROR", "Error in login request for Inside temperature with status code: " + response.statusCode + " Body: " + body);
					}
				}
			else {
			self.sendSocketNotification("UNKNOWN_ERROR", "Unknown error within /auth/sessions has occurred: " + response + " Body: " + body);
			}
			request({
			url: iUrl + "/nodes",
			headers: {
					'Content-Type': 'application/vnd.alertme.zoo-6.1+json',
					'Accept': 'application/vnd.alertme.zoo-6.1+json',
					'X-Omnia-Client': 'Hive Web Dashboard',
					'cache-control': "no-cache",
					'X-Omnia-Access-Token': sessionID,
					 },
			method: "GET",
			}, function (error, response, body) {
			//
				if (response && response.statusCode) {
					if (!error && response.statusCode == 200) {
						self.sendSocketNotification("INSIDE", body);
						var responseJson = JSON.parse(body);
						}
					else if (response.statusCode == 401) {
						self.sendSocketNotification("401_ERROR", "Authorisation error username / password missing or incorrect: " + response.statusCode + " Body: " + body);
						}
					else {
						self.sendSocketNotification("INSIDE_ERROR", "Error in devices request for Inside temperature with status code: " + response.statusCode + " Body: " + body);
						}
					}
				else {
				self.sendSocketNotification("UNKNOWN_ERROR", "Unknown error within /nodes has occurred: " + response + " Body: " + body);
					}
				})
				});
		
		setTimeout(function() { self.getData(); }, this.config.refreshInterval);
		},
	
	socketNotificationReceived: function(notification, payload) {
		if (notification === 'CONFIG') {
			this.config = payload;
		}
		else if (notification === "DATA" && this.config !== null){
			this.getData();
		}
	}
});