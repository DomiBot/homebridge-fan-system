

let Service, Characteristic;

const child_process = require('child_process');
const converter = require('color-convert');
const path = require('path');
const fs = require('fs');
const fetch = require("node-fetch");
const packageJson = require("../package.json");

module.exports = function(homebridge) {
	Service = homebridge.hap.Service;
	Characteristic = homebridge.hap.Characteristic;

	homebridge.registerAccessory(
		"homebridge-fan-system",
		"fan-system",
		FanAccessory
	);
}

function FanAccessory(log, config) {
	this.log          = log;
	this.config       = config
	this.on           = 0
	this.brightness   = 0
	this.hue          = 0
	this.saturation   = 0

	this.enabled = true ;

	try {
		if (!this.ip)
			throw new Error("ip not set!")
		if (!this.token)
			throw new Error("token not set!")
		if (!this.vpin)
			throw new Error("vpin not set!")
	} catch (err) {
		this.log("An error has been thrown! " + err);
		this.log("homebridge-rgb-ledstrip won't work until you fix this problem");
		this.enabled = false;
	}
	
	this.fanService = new Service.Fan(this.config.name);

	this.fanService
		.getCharacteristic(Characteristic.On)
		.onGet(this.getToggleState.bind(this, "on"))
		.onSet(this.setToggleState.bind(this, "on"))

	this.fanService
		.addCharacteristic(Characteristic.Active)
		.onGet(this.getToggleState.bind(this, "brightness"))
		.onSet(this.setToggleState.bind(this, "brightness"))

	this.fanService
		.addCharacteristic(Characteristic.RotationSpeed)
		.onGet(this.getToggleState.bind(this, "hue"))
		.onSet(this.setToggleState.bind(this, "hue"))

	
	// Accessory information
	this.accessoryInformationService = new Service.AccessoryInformation();

	this.accessoryInformationService.setCharacteristic(
		Characteristic.Identify,
		true
	);
	this.accessoryInformationService.setCharacteristic(
		Characteristic.Manufacturer,
		"Domi"
	);
	this.accessoryInformationService.setCharacteristic(
		Characteristic.Model,
		"DIY"
	);
	this.accessoryInformationService.setCharacteristic(
		Characteristic.Name,
		"homebridge-fan-system"
	);
	this.accessoryInformationService.setCharacteristic(
		Characteristic.SerialNumber,
		"DomiFanSystem"
	);
	this.accessoryInformationService.setCharacteristic(
		Characteristic.FirmwareRevision,
		packageJson.version
	);

	// Services list
	this.services = [this.service, this.accessoryInformationService];
	this.services.push(this.fanService)

}
  
FanAccessory.prototype.getToggleState = function(characteristicName){
	fetch("http://" + this.config.ip + ":8080/" + this.config.token + "/get/V" + this.config.vpin)
		.then((response) => response.json())
		.then((data) =>  {  
			return data[0]
		})
			.catch((error) => {
				this.log.error(`Request to webhook failed. (${path})`);
				this.log.error(error);
		});
}
	
FanAccessory.prototype.setToggleState = function(characteristicName, value){
	if(value == true){ value = 1 }else if(value == false){ value = 0 }
	fetch("http://" + this.config.ip + ":8080/" + this.config.token + "/update/V" + this.config.vpin + "?value=" + value)
		.then((response) => {  
			if (response.ok === false) {
				throw new Error(`Status code (${response.status})`);
			}
		})
			.catch((error) => {
				this.log.error(`Request to webhook failed. (${path})`);
				this.log.error(error);
		});
}


FanAccessory.prototype.getServices = function(){
	return this.services;
};