'use strict';

/* Magic Mirror
 * Module: MMM-Hive
 *
 * By Stuart McNally
 * MIT Licensed.
 */

const NodeHelper = require('node_helper');
var request = require('request');
var fs = require('fs');

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
		var lUrl = this.config.loginUrl;
    var lUrlPlus = this.config.loginUrlPlus;
    var iUrlProducts = this.config.insideUrlProducts;
    var iUrlDevices = this.config.insideUrlDevices;
		var myPostcode = this.config.postcode;
		var myHiveUser = this.config.username;
		var myHivePassword = this.config.password;
		var myHeaders = this.config.hiveHeaders;
		var sessionID;
    var jsonLocation = this.config.jsonLocation

    var tokenConfig = this.config.token;

    var hiveToken = fs.readFileSync(jsonLocation, 'utf8');
    
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
			url: lUrl + lUrlPlus,
      //url: 'https://beekeeper-uk.hivehome.com/1.0/cognito/refresh-token',
			headers: { 'Content-Type': 'application/json; charset=utf-8' },
			method: "POST",
      //body: tokenConfig,
      body: hiveToken,
      }, function (error, response, body) {
      var responseJson = JSON.parse(body);
      sessionID = responseJson.token;
					
			request({
			url: iUrl + iUrlProducts,
      //url: 'https://beekeeper-uk.hivehome.com/1.0/products',
			headers: {
					'Content-Type': 'application/json',
					'authorization': sessionID,
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
			request({
			url: iUrl + iUrlDevices,
      //url: "https://beekeeper-uk.hivehome.com/1.0/devices",
			headers: {
					'Content-Type': 'application/json',
					'authorization': sessionID,
					 },
			method: "GET",
			}, function (error, response, body) {
			//
				if (response && response.statusCode) {
					if (!error && response.statusCode == 200) {
						self.sendSocketNotification("DEVICES", body);
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