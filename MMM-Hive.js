/* global Module */

/* Magic Mirror
 * Module: MMM-Hive
 *
 * By Stuart McNally
 * MIT Licensed.
 */

Module.register('MMM-Hive',{

    defaults: {
		animationSpeed: 1000,
		updateInterval: 10 * 60000, //update temperature every 10 minutes, value in milliseconds
		refreshInterval: 1000 * 60 * 10, //refresh once a minute
		lang: config.language,
		initialLoadDelay: 0,
		username: '',
		password: '',
		postcode: '',
		insideText: 'Inside:',
		outsideText: 'Outside:',
		targetTempText: 'Target Temperature:',
		insideIconSet: 'fa fa-home',
		showNext: true,
		highestTemp: '30',
		highTemp: '25',
		lowTemp: '20',
		lowestTemp: '15',
		animatedLoading: true,
		temperatureSuffix: '°C',
		outsideUrl: 'https://weather-prod.bgchprod.info/weather?postcode=',
		insideUrl: 'https://api-prod.bgchprod.info:443/omnia',
		debug: false,
		hiveHeaders: {
						'Content-Type': 'application/vnd.alertme.zoo-6.1+json',
						'Accept': 'application/vnd.alertme.zoo-6.1+json',
						'X-Omnia-Client': 'Hive Web Dashboard',
						'cache-control': "no-cache",
					  }
				},

	getStyles: function() {
		return ["MMM-Hive.css","font-awesome.css"];
	},

	start: function() {
		Log.info('Starting module: ' + this.name);

		moment.locale(config.language);
		this.outsideT = null;
		this.insideT = null;
		this.insideS = null;
		this.insideTarget = null;

		this.loaded = false;
        this.error = false;
		this.error401 = false;
		this.errorPostcode = false;
		this.dataID = null;
		this.sendSocketNotification('CONFIG', this.config);
		this.sendSocketNotification('DATA', null);
		this.dataTimer();
	},
	
	dataTimer: function() {
		var self = this;
		Log.log("dataTime Started")
		this.dataID = setInterval(function() { self.sendSocketNotification('DATA', null); }, this.config.updateInterval);
	},
	
	processData: function(FLAG, result) {
		var self = this;
		
        if (this.loaded === false) { self.updateDom(self.config.animationSpeed) ; }
        this.loaded = true;
		
		if (FLAG === "INSIDE"){
			for (var i=0; i<result.nodes.length; i++) {
				if (result.nodes[i].name === "Your Receiver" && result.nodes[i].attributes.stateHeatingRelay) {

				var insideTemp = result.nodes[i].attributes.temperature.reportedValue;				
					this.insideT = insideTemp;
				var heatingState = result.nodes[i].attributes.stateHeatingRelay.reportedValue || "unknown";
					this.insideS = heatingState;
				var heatingTarget = targetHeatTemperature = result.nodes[i].attributes.targetHeatTemperature.reportedValue || "unknown";
					this.insideTarget = heatingTarget
				}
		}}

		else if (FLAG === "OUTSIDE"){
		var outsideTemp = result[0].weather.temperature.value;
					this.outsideT = outsideTemp;
					}
				},

	getDom: function() {
	
		var information = document.createElement("div");
		
		if (this.error401) {
            information.innerHTML = "Error logging into the Hive website.</br>Please ensure that your Hive Username / Password</br>are set in the config.js file.";
            information.className = "light small";
            return information;
        }
	
		if (this.errorPostcode) {
            information.innerHTML = "Error logging into the Hive website.</br>Please ensure that your Post Code</br>is set and correct in the config.js file.";
            information.className = "light small";
            return information;
        }
	
	    if (!this.loaded) {
			if (this.config.animatedLoading == true) {
            information.className = "fa fa-spinner fa-pulse fa-3x fa-fw light small";
            return information;
			}
			else {
			information.innerHTML = "Loading...";
			information.className = "light small";
			return information;
			}
        }
		
        if (this.error) {
            information.innerHTML = "Error loading data";
			information.className = "light small";
            return information;
        }
		
		var table = document.createElement("table");
		
		var temperatureRow = document.createElement("tr");
		
		var outsideIcon = document.createElement("td");
		
		if (this.outsideT >= this.config.highestTemp) {
        outsideIcon.setAttribute("aria-hidden","true");
		outsideIcon.className = "fa fa-thermometer-full small dimmed";
		outsideIcon.style.cssText="color:red;"; 
			temperatureRow.appendChild(outsideIcon);
		}
		else if (this.outsideT >= this.config.highTemp) {
        outsideIcon.setAttribute("aria-hidden","true");
		outsideIcon.className = "fa fa-thermometer-three-quarters small dimmed";
			temperatureRow.appendChild(outsideIcon);
		}
		else if (this.outsideT >= this.config.lowTemp) {
        outsideIcon.setAttribute("aria-hidden","true");
		outsideIcon.className = "fa fa-thermometer-half small dimmed";
			temperatureRow.appendChild(outsideIcon);
		}
		else if (this.outsideT >= this.config.lowestTemp) {
        outsideIcon.setAttribute("aria-hidden","true");
		outsideIcon.className = "fa fa-thermometer-quarter small dimmed";
			temperatureRow.appendChild(outsideIcon);
		}
		else if (this.outsideT < this.config.lowestTemp) {
        outsideIcon.setAttribute("aria-hidden","true");
		outsideIcon.className = "fa fa-thermometer-empty small dimmed";
			temperatureRow.appendChild(outsideIcon);
		}
        
		var outsideCell = document.createElement("td");
		outsideCell.innerHTML = this.config.outsideText + " " + this.outsideT + this.config.temperatureSuffix;
		outsideCell.className = "small light";
		outsideCell.style.cssText="color:white;";
		temperatureRow.appendChild(outsideCell)
		
		var buffer = document.createElement("td");
		buffer.innerHTML = " "
		temperatureRow.appendChild(buffer)
		
		var onOffIcon = document.createElement("td");
		
		if (this.insideS == "OFF") {
        onOffIcon.setAttribute("aria-hidden","true");
		onOffIcon.className = this.config.insideIconSet + " small dimmed";
			temperatureRow.appendChild(onOffIcon);
		}
		else if (this.insideS == "ON") {
        onOffIcon.setAttribute("aria-hidden","true");
		onOffIcon.className = this.config.insideIconSet + " small";
		onOffIcon.style.cssText="color:red;"; 
			temperatureRow.appendChild(onOffIcon);
		}

		var insideCell = document.createElement("td");
		insideCell.innerHTML = this.config.insideText + " " + this.insideT + this.config.temperatureSuffix;
		insideCell.className = "light small";
		insideCell.style.cssText="color:white;";
		temperatureRow.appendChild(insideCell);
			
		var targetTemperatureRow = document.createElement("tr");
		if (this.config.showNext == true) {
		var targetTemperatureCell = document.createElement("td");
		targetTemperatureCell.colSpan = 5;
			if (this.insideTarget <= 1) {
					var frostCell = document.createElement("td");
					frostCell.setAttribute("aria-hidden","true");
					frostCell.className = "fa fa-snowflake-o";
					frostCell.style.cssText="color:white;";
					targetTemperatureCell.innerHTML = "Frost Protect Enabled  ";
					targetTemperatureCell.className = "light xsmall";
					targetTemperatureCell.appendChild(frostCell);
					targetTemperatureCell.insertBefore(frostCell, targetTemperatureCell.firstChild);
					targetTemperatureRow.appendChild(targetTemperatureCell);
					}
			else {	
				targetTemperatureCell.innerHTML = this.config.targetTempText + " " + this.insideTarget + this.config.temperatureSuffix;
				targetTemperatureCell.className = "light xsmall";
				targetTemperatureRow.appendChild(targetTemperatureCell);
				}}

		table.appendChild(temperatureRow);
		table.appendChild(targetTemperatureRow);
				
		return table;
	}, 
	
	socketNotificationReceived: function(notification, payload) {
		var dt = new Date();
		var utcDate = dt.toUTCString();
		if (notification === "INSIDE") {
			if (this.config.debug == true) {
				Log.log(utcDate + " " + this.name + " received notification: " + notification + " - Payload: " + payload);
				this.processData("INSIDE", JSON.parse(payload));
				this.updateDom(this.config.animationSpeed);
				this.loaded = true;
				this.error = false;
				this.error401 = false;
				}
			else {
				this.processData("INSIDE", JSON.parse(payload));
				this.updateDom(this.config.animationSpeed);
				this.loaded = true;
				this.error = false;
				this.error401 = false;
				}
			}
		else if (notification === "OUTSIDE") {
			if (this.config.debug == true) {
				Log.log(utcDate + " " + this.name + " received notification: " + notification + " - Payload: " + payload);
				this.processData("OUTSIDE", JSON.parse("[" + payload + "]"));
				this.updateDom(this.config.animationSpeed);
				this.loaded = true;
				this.error = false;
				this.error401 = false;
				}
			else {
				this.processData("OUTSIDE", JSON.parse("[" + payload + "]"));
				this.updateDom(this.config.animationSpeed);
				this.loaded = true;
				this.error = false;
				this.error401 = false;
				}
			}
		else if (notification === "401_ERROR" || notification === "400_ERROR") {
			if (this.config.debug == true) {
				Log.log(utcDate + " " + this.name + " received notification: " + notification + " - Payload: " + payload);
				this.updateDom(this.config.animationSpeed);
				this.loaded = true;
				this.error = false;
				this.error401 = true;
				}
			else {
				this.updateDom(this.config.animationSpeed);
				this.loaded = true;
				this.error = false;
				this.error401 = true;
				}
			}
		else if (notification === "POSTCODE_ERROR") {
			if (this.config.debug == true) {
				Log.log(utcDate + " " + this.name + " received notification: " + notification + " - Payload: " + payload);
				this.updateDom(this.config.animationSpeed);
				this.loaded = true;
				this.error = false;
				this.error401 = false;
				this.errorPostcode = true;
				}
			else {
				this.updateDom(this.config.animationSpeed);
				this.loaded = true;
				this.error = false;
				this.error401 = false;
				this.errorPostcode = true;
				}
			}
		else if (notification === "INSIDE_ERROR" || notification === "OUTSIDE_ERROR") {
			if (this.config.debug == true) {
				Log.log(utcDate + " " + this.name + " received notification: " + notification + " - Payload: " + payload);
				clearInterval(this.dataID);
				this.dataID = null;
				this.updateDom(this.config.animationSpeed);
				this.dataTimer();
				this.loaded = true;
				this.error = true;
				this.error401 = false;
				}
			else {
				clearInterval(this.dataID);
				this.dataID = null;
				this.updateDom(this.config.animationSpeed);
				this.dataTimer();
				this.loaded = true;
				this.error = true;
				this.error401 = false;
				}
			}
		else if (notification === "UNKNOWN_ERROR") {
			if (this.config.debug == true) {
				Log.log(utcDate + " " + this.name + " received notification: " + notification + " - Payload: " + payload);
				clearInterval(this.dataID);
				this.dataID = null;
				this.updateDom(this.config.animationSpeed);
				this.dataTimer();
				this.loaded = true;
				this.error = true;
				this.error401 = false;
				}
			else {
				clearInterval(this.dataID);
				this.dataID = null;
				this.updateDom(this.config.animationSpeed);
				this.dataTimer();
				this.loaded = true;
				this.error = true;
				this.error401 = false;
				}
			}
	},
});