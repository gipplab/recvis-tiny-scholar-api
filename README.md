# hyplag-recvis-tiny-scholar-api

## About Tiny Scholar API
- This project is meant to be used as very small unofficial Google Scholar API for fetching bibliographic data based on input academic paper title. This API painfully slows down requests down to one request per 2 minute because Google Scholar is aggressively blocking the fetching process otherwise. Tiny Scholar API, whenever successfully fetching process happens, caches the request and doesn't count it towards API fetching limit of one document per 2 minutes.  

## Deployment/Development Tiny Scholar API
### Configuration of front-end.
- cd /path/to/repo
- nano config.js
    - Set TINY_SCHOLAR_PORT
    - Set DELAY_WINDOW_MIN, at the end of this window, request count will be resetted for the incoming IP address.
    - Set DELAY_AFTER_NUMBER_OF_REQ
    - Set DELAY_MINUTES
    - Set SERVE_ONLY_CACHE, this option will make Tiny Scholar API serve only from cache.

### Install libraries
- npm install

### Run
- node main.js