const config = require("./config.js");
const loggerModule = require("./logger-module.js");
const NotifierBot = require("./NotifierBot.js");

const express = require('express')
const app = express()
 
const stealthyGoogleScrapper = require("./stealthyScholarScrapper_v0.2.js");

var cache = require('persistent-cache');
const slowDown = require("express-slow-down");

var notifierBot = null;
if(config.TELEGRAM_IS_BOT_ACTIVE) {
    notifierBot = new NotifierBot(config.TELEGRAM_SECRET_TOKEN, config.TELEGRAM_ID_LIST_TO_BE_NOTIFIED, config.TELEGRAM_HELP_TEXT);
    notifierBot.setErrorHandler(function(err){
        console.log("Notifier bot error: "+err);
    })
    loggerModule.on("all", function(message){
        notifierBot.notifyUsers(message);
    })
}


const PORT = config.TINY_SCHOLAR_PORT;
const delayWindowMinute = config.DELAY_WINDOW_MIN;
const delayAfterNumberOfRequests = config.DELAY_AFTER_NUMBER_OF_REQ;
const delayMinutes = config.DELAY_MINUTES;
const IS_SERVING_ONLY_CACHE = config.SERVE_ONLY_CACHE;
 
const speedLimiter = slowDown({
    windowMs: delayWindowMinute * 60 * 1000, // n minutes
    delayAfter: delayAfterNumberOfRequests, // allow m requests per n minutes, then...
    delayMs: delayMinutes * 60 * 1000 // begin adding x minutes of delay per request above threshold:
});

const isHeadless = false;
const isDevtools = false;
const isNoSandboxMode = false;

var isApiInitialized = false;

var keyValueCache = cache();

stealthyGoogleScrapper.initializeModule(isHeadless, isDevtools, isNoSandboxMode, function(){
    isApiInitialized = true;
    loggerModule.info("Successfully initialized stealthy google scrapper.");
});

const textTruncateCharLimit = 30;
text_truncate = function(str, length, ending) {
    if (length == null) {
      length = 100;
    }
    if (ending == null) {
      ending = '...';
    }
    if (str.length > length) {
      return str.substring(0, length - ending.length) + ending;
    } else {
      return str;
    }
  };

function returnCachedResponseImmediately(request, response, next) {
    if(request.body && request.body.title) {
        const title = request.body.title;
        const lowerCaseTrimmedSanitizedTitle = text_truncate(title.toLowerCase().trim().replace(/[^0-9a-z]/gi, ''), textTruncateCharLimit, '');
        
        if(lowerCaseTrimmedSanitizedTitle.length <= 1) {
            response.send({
                "msg": "Invalid title.",
                "data": {
                    isSucceded: false,
                }
            });
            return;
        }

        const cachedResponse = keyValueCache.getSync(lowerCaseTrimmedSanitizedTitle);
        if(cachedResponse) {
            loggerModule.info("Successfully served a cached response: "+title);
            response.send({
                "msg": "Succesfully fetched bibtex data.",
                "data": {
                    isSucceded: true,
                    title: title,
                    bibtex: cachedResponse
                }
            })
        } else {
            request.lowerCaseTrimmedSanitizedTitle  = lowerCaseTrimmedSanitizedTitle;
            next();
        }
    } else {
        response.send({
            "msg": "title needs to be present in the request.",
            "data": {
                isSucceded: false
            }
        })
    }
}

var googleJobQueue = [];
var isGoogleJobRunning = false;


function handleGoogleJob(googleJob, jobFinishedCallback) {
    
    const paperTitle = googleJob.title;
    const jobCallback = googleJob.callback;
    
    loggerModule.info('Google Job started for '+paperTitle);
    stealthyGoogleScrapper.getBibtexOfTopArticleInSearch(paperTitle, function(err, res){
        jobCallback(err, res);
        jobFinishedCallback();
    });
}

var isGoogleJobRunning = false;
const intervalMs = 20000;

setInterval(() => {
    if(!isGoogleJobRunning) {
        if(googleJobQueue.length > 0) {
            isGoogleJobRunning = true;
            const currentJob = googleJobQueue[0];
            googleJobQueue.shift();
            handleGoogleJob(currentJob, function(){
                loggerModule.info('Google Job finished.');
                isGoogleJobRunning = false;
            })
        } else {
            //pass
        }
    } else {
        //pass
    }
}, intervalMs);

app.use(express.json());
app.use(returnCachedResponseImmediately);
app.post('/get-bibtex-data-from-title', speedLimiter, function(request, response){
    if(!isApiInitialized) {
        response.send({
            "msg": "API is not initialized yet.",
            "data": {
                isSucceded: false
            }
        })
        
        return;
    }
    
    const title = request.body.title;
    const lowerCaseTrimmedSanitizedTitle = request.lowerCaseTrimmedSanitizedTitle;
    
    loggerModule.info("Request received "+"/get-bibtex-data-from-title "+title);

    if(IS_SERVING_ONLY_CACHE) {
        loggerModule.info("Serving only cache, "+title+" is not available.");
        loggerModule.warn("[ABSENT-PAPER] full title: "+title+" truncated: "+lowerCaseTrimmedSanitizedTitle)
        response.send({
            "msg": "This data is not available. Tiny scholar API is currently serving only cached data.",
            "data": {
                isSucceded: false
            }
        })
    } else {
        googleJobQueue.push({
            title: title,
            callback: function(err, result){
                if(!err) {
                    response.send({
                        "msg": "Succesfully fetched bibtex data.",
                        "data": {
                            isSucceded: true,
                            title: title,
                            bibtex: result
                        }
                    })
                    keyValueCache.putSync(lowerCaseTrimmedSanitizedTitle, result);
                    loggerModule.info("Successfully cached "+title)
                } else {
                    loggerModule.error("Error fetching data from Google "+err);
                    loggerModule.warn("[ABSENT-PAPER] full title: "+title+" truncated: "+lowerCaseTrimmedSanitizedTitle)
                    response.send({
                        "msg": "System error, unable to fetch bibtex data.",
                        "data": {
                            isSucceded: false
                        }
                    })
                }
            }
        });
    }
});

app.listen(PORT);