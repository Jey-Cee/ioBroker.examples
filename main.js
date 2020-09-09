'use strict';

/*
 * Created with @iobroker/create-adapter v1.23.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require('@iobroker/adapter-core');

//Load object definitions
const oDefs = require('./lib/object_definition.json');
const ah = require('iobroker-adapter-helpers').roles;

console.log(ah);
// Load your modules here, e.g.:
// const fs = require("fs");

class Examples extends utils.Adapter {

	/**
	 * @param {Partial<ioBroker.AdapterOptions>} [options={}]
	 */
	constructor(options) {
		super({
			...options,
			name: 'examples',
		});
		this.on('ready', this.onReady.bind(this));
		this.on('objectChange', this.onObjectChange.bind(this));
		this.on('stateChange', this.onStateChange.bind(this));
		this.on('message', this.onMessage.bind(this));
		this.on('unload', this.onUnload.bind(this));
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	async onReady() {
		// Initialize your adapter here

		// The adapters config (in the instance object everything under the attribute "native") is accessible via
		// this.config:
		this.log.info('config option1: ' + this.config.option1);
		this.log.info('config option2: ' + this.config.option2);


		// in this template all states changes inside the adapters namespace are subscribed
		this.subscribeStates('*');

		//create object based on the template
		await this.createObject('temperature', null);
		await this.createObject('setTemperature', null);
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 * @param {() => void} callback
	 */
	onUnload(callback) {
		try {
			this.log.info('cleaned everything up...');
			callback();
		} catch (e) {
			callback();
		}
	}

	/**
	 * Is called if a subscribed object changes
	 * @param {string} id
	 * @param {ioBroker.Object | null | undefined} obj
	 */
	onObjectChange(id, obj) {
		if (obj) {
			// The object was changed
			this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
		} else {
			// The object was deleted
			this.log.info(`object ${id} deleted`);
		}
	}

	/**
	 * Is called if a subscribed state changes
	 * @param {string} id
	 * @param {ioBroker.State | null | undefined} state
	 */
	onStateChange(id, state) {
		if (state) {
			// The state was changed
			this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);

			const idArray = id.split('.');
			const stateName = idArray.pop();

			switch(stateName){
				case 'setTemperature':
					this.setStateTmpl('temperature', null, state.val, true, null);
					break;
			}

		} else {
			// The state was deleted
			this.log.info(`state ${id} deleted`);
		}



	}

	// /**
	//  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
	//  * Using this method requires "common.message" property to be set to true in io-package.json
	//  * @param {ioBroker.Message} obj
	//  */
	 onMessage(obj) {
	// 	if (typeof obj === 'object' && obj.message) {
	// 		if (obj.command === 'send') {
	// 			// e.g. send email or pushover or whatever
	// 			this.log.info('send command');

	// 			// Send response in callback if required
	// 			if (obj.callback) this.sendTo(obj.from, obj.command, 'Message received', obj.callback);
	// 		}
		}
	// }

	/**
	 * @param {string} name	- Name of the object definition
	 * @param {string|null} parent - Optional, set null if not used. Parent of id if it is a sub object of a device, channel or other. e.g. 'examples.0.test'
	 * @returns {Promise<object>}
	 */
	async createObject(name, parent){
		const id = parent !== null ? `${parent}.${name}` : name;

		const obj = {};
		obj.type = oDefs[name].type;
		obj.common = oDefs[name].common;
		obj.native = oDefs[name].native;


		// Subscribe state if its an write true
		oDefs[name].common.write && this.subscribeStates(id);

		return await this.setObjectAsync(id, obj);
	}

	/**
	 *
	 * @param {string} name - The name of the state
	 * @param {string|null} parent - Optional, set null if not used. Parent of id if it is a sub object of a device, channel or other. e.g. 'examples.0.test'
	 * @param {string|number|object|array} val
	 * @param {boolean|null} ack - Optional, set to null if not used.
	 * @param {number|null} expire - Optional, time in seconds before state expires and is set to null. Set null if not used.
	 * @returns {Promise<object>}
	 */
	async setStateTmpl(name,parent, val, ack, expire){
		const id = parent !== null ? `${parent}.${name}` : name;

		const stateValue = {};

		if(ack !== null) stateValue.ack = ack;
		if(expire !== null) stateValue.expire = expire;

		if(oDefs[name].condition){
			stateValue.val = await this.convertValue(oDefs[name].condition, val);
		}else{
			stateValue.val = val;
		}

		return await this.setStateAsync(id, stateValue);
	}

	/**
	 * Convert value delivered by device or API using the object template.
	 * @param {object} cmd - The converter instructions
	 * @param {string|number} value - The delivered value
	 * @returns {Promise<any>}
	 */
	async convertValue(cmd, value){
		const keys = Object.keys(cmd);
		for(const k in keys){

			switch(keys[k]) {
				case 'multiplier': {
					const multiplier = cmd[keys[k]];
					return value * multiplier;
				}
				case 'divider': {
					const divider = cmd[keys[k]];
					return value / divider;
				}
				case 'number': {
					if (typeof value === 'number') {
						return cmd[keys[k]][value];
					} else {
						const numbers = cmd[keys[k]][value];
						for (let i in numbers) {
							//if()
						}
					}
				}
			}

		}
	}

}

// @ts-ignore parent is a valid property on module
if (module.parent) {
	// Export the constructor in compact mode
	/**
	 * @param {Partial<ioBroker.AdapterOptions>} [options={}]
	 */
	module.exports = (options) => new Examples(options);
} else {
	// otherwise start the instance directly
	new Examples();
}