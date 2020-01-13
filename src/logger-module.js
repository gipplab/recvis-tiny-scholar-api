const LOG_TYPE = {
    INFO: "info",
    WARN: "warn",
    ERROR: "error"
};

const LOG_TYPE_LIST = [
    LOG_TYPE.INFO,
    LOG_TYPE.WARN,
    LOG_TYPE.ERROR
];

var CALLBACKS = {
    "info": null,
    "warn": null,
    "error": null,
    "all": null
};

function isValidLogType(type) {
    return LOG_TYPE_LIST.includes(type);
}

function triggerCallbacks(logType, message) {
    if(CALLBACKS[logType]) {
        CALLBACKS[logType](message);
    }

    if(CALLBACKS["all"]) {
        CALLBACKS["all"](message);
    }
}

module.exports = {
    info: function(message) {
        triggerCallbacks(LOG_TYPE.INFO, message);
        console.log(LOG_TYPE.INFO + ": "+message);
    },
    warn: function(message) {
        triggerCallbacks(LOG_TYPE.WARN, message);
        console.log(LOG_TYPE.WARN + ": "+message);
    },
    error: function(message) {
        triggerCallbacks(LOG_TYPE.ERROR, message);
        console.log(LOG_TYPE.ERROR + ": "+message);
    },
    on: function(logType, callback) {
        if(isValidLogType(logType)) {
            CALLBACKS[logType] = callback;
        } else if (logType == "all") {
            CALLBACKS["all"] = callback;
        } else {
            console.log(LOG_TYPE.ERROR + ": "+"Invalid log type. Cannot set the callback.");
        }
    }
}