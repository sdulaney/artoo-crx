;(function(undefined) {

  /**
   * artoo chrome injection
   * =======================
   *
   * This chrome content script injects artoo in every relevant page when the
   * artoo's extension is activated.
   */

  function injectScript() {

    // Creating script element
    var script = document.createElement('script'),
        body = document.getElementsByTagName('body')[0];

    script.src = chrome.extension.getURL('build/artoo.chrome.js');
    script.type = 'text/javascript';
    script.id = 'artoo_injected_script';
    script.setAttribute('chrome', 'true');

    // Appending to body
    body.appendChild(script);
  }

  // Requesting variables from background page
  chrome.runtime.sendMessage({variable: 'enabled'}, function(response) {

    // If artoo is enabled, we inject the script
    if (response.enabled)
      injectScript();
  });

  // Listening to page's messages
  window.addEventListener('message', function(e) {
    // console.log('received', e);
  }, false);
}).call(this);

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if( request.message === "clicked_browser_action" ) {
        console.log("Browser action clicked");
        // Run Artoo script on BrowserAction click https://github.com/medialab/artoo/issues/240
        // artoo-r2r.js
        var scraper = {
          iterator: '#s-results-list-atf > li',
          data: {
              "ASIN": {

                  method: function($) {
                      return $(this).attr('data-asin');
                  }
              }
          }
        };

        function nextUrl($page) {
          return $page.find('#pagnNextLink').attr('href');
        }

        artoo.log.debug('Starting the scraper...');
        var frontpage = artoo.scrape(scraper);

        artoo.ajaxSpider(
          function(i, $data) {
            return nextUrl(!i ? artoo.$(document) : $data);
          },
          {
            limit: 1,
            throttle: 2500,
            scrape: scraper,
            concat: true,
            done: function(data) {
              artoo.log.debug('Finished retrieving data. Downloading...');
              artoo.saveCsv(
                frontpage.concat(data),
                {filename: 'asin.csv'}
              );
            }
          }
        );




      }
  });
