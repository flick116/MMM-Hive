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
		hotWaterText: 'Hot Water:',
		thermBattText: 'Thermostat Battery:',
		insideIconSet: 'fa fa-home',
		hBoostOffText: 'Not Active',
		hwBoostOffText: 'Off',
		boostRow: false,
		showNext: true,
		showHotWater: false,
		showBattery: false,
		batteryIcon: false,
		highestTemp: '30',
		highTemp: '25',
		lowTemp: '20',
		lowestTemp: '15',
		animatedLoading: true,
		temperatureSuffix: '°C',
		nodeName: 'heating',
		outsideUrl: 'http://weather-prod.bgchprod.info/weather?postcode=',
		insideUrl: 'https://beekeeper-uk.hivehome.com:443/1.0',
		loginUrl: 'https://beekeeper.hivehome.com:443/1.0',
    loginUrlPlus: '/cognito/login',
    insideUrlProducts: '/products',
    insideUrlDevices: '/devices',
		debug: false,
		hiveHeaders: {
						'Content-Type': 'application/json',
					  }
				},

	getStyles: function() {
		return ["font-awesome.css","MMM-Hive.css"];
	},

	start: function() {
		Log.info('Starting module: ' + this.name);

		moment.locale(config.language);
		this.outsideT = null;
		this.insideT = null;
		this.insideS = null;
		this.insideTarget = null;
		this.hotStateT = null;
		this.batteryT = null;
		this.hwBoost = null;
		this.hBoost = null;

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
			for (var i=0; i<result.length; i++) {
				if (result[i].type === this.config.nodeName) {
				var insideTemp = result[i].props.temperature;				
					this.insideT = insideTemp;
				var heatingState = result[i].state.status || "unknown";
					this.insideS = heatingState;
				var heatingBoost = result[i].state.boost || this.config.hBoostOffText;
					this.hBoost = heatingBoost;
				var heatingTarget = targetHeatTemperature = result[i].state.target || "unknown";
					this.insideTarget = heatingTarget
					//var hotState = result[1].state.status;
					//this.hotStateT = hotState
				}
								
				if (result[i].type === 'hotwater') {
					var hotState = result[i].state.status;
					this.hotStateT = hotState
					var hotWaterBoost = result[i].state.boost || this.config.hwBoostOffText;
					this.hwBoost = hotWaterBoost;
				}
				}}
				
		else if (FLAG === "DEVICES"){
					for (var i=0; i<result.length; i++) {
						if (result[i].type === 'thermostatui') {
						var battery = result[i].props.battery;				
							this.batteryT = battery;
						}}
						}
				
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
		
        // if (this.error) {
            // information.innerHTML = "Error loading data";
			// information.className = "light small";
            // return information;
        // }
		
		var table = document.createElement("table");
		
		//heating
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
		
		//if (this.insideS == "OFF") {
		if (this.insideT >= this.insideTarget) {
        onOffIcon.setAttribute("aria-hidden","true");
		onOffIcon.className = this.config.insideIconSet + " small dimmed";
			temperatureRow.appendChild(onOffIcon);
		}
		//else if (this.insideS == "ON") {
		else if (this.insideT < this.insideTarget) {
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
		
		if (this.config.batteryIcon == true) {
		var battIcon = document.createElement("td");
		
		if (this.batteryT >= 95) {
        battIcon.setAttribute("aria-hidden","true");
		battIcon.className = "fa fa-battery-full fa-rotate-270 xsmall dimmed";
			temperatureRow.appendChild(battIcon);
		}
		else if (this.batteryT <= 5) {
        battIcon.setAttribute("aria-hidden","true");
		battIcon.className = "fa fa-battery-empty fa-rotate-270 xsmall dimmed";
		battIcon.style.cssText="color:red;"; 
			temperatureRow.appendChild(battIcon);
		}
		else if (this.batteryT <= 25) {
        battIcon.setAttribute("aria-hidden","true");
		battIcon.className = "fa fa-battery-quarter fa-rotate-270 xsmall dimmed";
			temperatureRow.appendChild(battIcon);
		}
		else if (this.batteryT <= 50) {
        battIcon.setAttribute("aria-hidden","true");
		battIcon.className = "fa fa-battery-half fa-rotate-270 xsmall dimmed";
			temperatureRow.appendChild(battIcon);
		}
		else if (this.batteryT <= 94) {
        battIcon.setAttribute("aria-hidden","true");
		battIcon.className = "fa fa-battery-three-quarters fa-rotate-270 xsmall dimmed";
			temperatureRow.appendChild(battIcon);
		}
		}
		//
		
		//heating end
		
		//hotwater
		var hotWaterRow = document.createElement("tr");
		if (this.config.showHotWater == true && this.config.showBattery == false) {
		var hotWaterCell = document.createElement("td");
		hotWaterCell.colSpan = 5;
				hotWaterCell.innerHTML = this.config.hotWaterText + " " + this.hotStateT;
			if (this.hotStateT == "ON") {
				hotWaterCell.style.cssText="color:red;";
				hotWaterCell.className = "light xsmall";}
			else if (this.hotStateT == "OFF") {
				hotWaterCell.className = "light xsmall";}
				hotWaterRow.appendChild(hotWaterCell);
		}
		else if (this.config.showHotWater == true && this.config.showBattery == true) {
		var hotWaterCell = document.createElement("td");
		hotWaterCell.colSpan = 5;
				hotWaterCell.innerHTML = this.config.hotWaterText + " " + this.hotStateT + " || " + this.config.thermBattText + " " + this.batteryT + "%";
			if (this.hotStateT == "ON") {
				hotWaterCell.style.cssText="color:red;";
				hotWaterCell.className = "light xsmall";}
			else if (this.hotStateT == "OFF") {
				hotWaterCell.className = "light xsmall";}
				hotWaterRow.appendChild(hotWaterCell);
		}
		else if (this.config.showHotWater == false && this.config.showBattery == true) {
		var hotWaterCell = document.createElement("td");
		hotWaterCell.colSpan = 5;
				hotWaterCell.innerHTML = this.config.thermBattText + " " + this.batteryT + "%";
				hotWaterCell.className = "light xsmall";
				hotWaterRow.appendChild(hotWaterCell);
		}
		//hotwater end
		
		//target temp
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
			//target temp end
			
		//boost row
		var boostRow = document.createElement("tr");
		if (this.config.boostRow == true) {
		var hboostCell = document.createElement("td");
		hboostCell.colSpan = 3;
			if (this.hBoost == this.config.hwBoostOffText) {
		hboostCell.innerHTML = "H Boost: " + this.hBoost;
		hboostCell.className = "light xsmall";
		boostRow.appendChild(hboostCell);
			}
		else {
		hboostCell.innerHTML = "H Boost - Time: " + this.hBoost;
		hboostCell.className = "light xsmall";
		hboostCell.style.cssText="color:red;";
		boostRow.appendChild(hboostCell);
			}
		var hwboostCell = document.createElement("td");
		hwboostCell.colSpan = 3;
			if (this.hwBoost == this.config.hwBoostOffText) {
		hwboostCell.innerHTML = "HW Boost: " + this.hwBoost;
		hwboostCell.className = "light xsmall";
		boostRow.appendChild(hwboostCell);
			}
		else {
		hwboostCell.innerHTML = "HW Boost - Time: " + this.hwBoost;
		hwboostCell.className = "light xsmall";
		hwboostCell.style.cssText="color:red;";
		boostRow.appendChild(hwboostCell);
			}
		}
			//boost row end

		table.appendChild(temperatureRow);
		table.appendChild(targetTemperatureRow);
		//table.appendChild(hotWaterRow);
		//table.appendChild(boostRow);
				
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
			//testing
		else if (notification === "DEVICES") {
			if (this.config.debug == true) {
				Log.log(utcDate + " " + this.name + " received notification: " + notification + " - Payload: " + payload);
				this.processData("DEVICES", JSON.parse(payload));
				this.updateDom(this.config.animationSpeed);
				this.loaded = true;
				this.error = false;
				this.error401 = false;
				}
			else {
				this.processData("DEVICES", JSON.parse(payload));
				this.updateDom(this.config.animationSpeed);
				this.loaded = true;
				this.error = false;
				this.error401 = false;
				}
			}
			//testing end
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