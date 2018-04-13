document.addEventListener('DOMContentLoaded', function (event) {

  require([
    "esri/tasks/Locator",
  ], function (Locator) {

    calcite.init();

    const searchInput = document.querySelector("#search-input");
    searchInput.focus();

    const searchBtn = document.querySelector("#search-btn");
    const resultsTypeLabel = document.querySelector("#result-type-label");
    const resultsPanel = document.querySelector("#search-results-panel");
    const resultDetailsTable = document.querySelector("#result-table");
    const selectedResultPanel = document.querySelector("#selected-result-panel");

    const minCharacterInput = 2;

    // ESRI GEOCODER //
    const esriGeocoder = new Locator({
      url: "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer",
      outSpatialReference: { wkid: 4326 }
    });

    function _clearUI() {
      resultsTypeLabel.innerHTML = "&nbsp;";
      resultsPanel.innerHTML = "";
      selectedResultPanel.innerHTML = "";
      resultDetailsTable.innerHTML = "";
    }

    function inputUpdate() {
      _clearUI();
      if(searchInput.value.length === 0) {
        calcite.addClass(searchBtn, "btn-disabled");
      } else {
        calcite.removeClass(searchBtn, "btn-disabled");
        suggest();
      }
    }

    function displayResults(results, resultsLabel, isSuggestion) {
      _clearUI();
      resultsTypeLabel.innerHTML = resultsLabel;

      results.forEach((result) => {

        if(result.source) {
          const resultsSourceNode = document.createElement("h4");
          resultsSourceNode.className = isSuggestion ? "side-nav-title text-light-gray" : "side-nav-title text-blue";
          resultsSourceNode.innerHTML = result.source.name;
          resultsPanel.appendChild(resultsSourceNode);
        }

        const allResults = result.results || [result];
        allResults.forEach((singleResult) => {
          _displayResult(singleResult, isSuggestion);
        });

      });

      if(!isSuggestion && (results.length === 1)) {
        displayResultDetails(results[0]);
      }

    }

    function getResultLabel(result) {

      if(result.attributes && result.attributes.Addr_type) {
        switch (result.attributes.Addr_type) {
          case "POI":
            return result.address + ", " + result.attributes.Place_addr;
            break;

          case "StreetName":
          case "StreetAddress":
          case "PointAddress":
            return result.address;
            break;

          default:
            return (result.text || result.name || result.address);
        }

      } else {
        return (result.text || result.name || result.address);
      }
    }

    function _displayResult(result, isSuggestion) {
      const resultLabel = getResultLabel(result);

      const resultNode = document.createElement("span");
      resultNode.className = "side-nav-link";
      resultNode.innerHTML = resultLabel;
      resultsPanel.appendChild(resultNode);

      if(result.score) {
        const scoreNode = document.createElement("mark");
        scoreNode.className = isSuggestion ? "label right" : "label label-blue right";
        scoreNode.innerHTML = result.score;
        resultNode.appendChild(scoreNode);
      }

      if(isSuggestion) {
        calcite.addClass(resultNode, "text-light-gray avenir-italic");
        calcite.addEvent(resultNode, "click", () => {
          searchSuggestion(result);
        });
      } else {
        calcite.addEvent(resultNode, "click", () => {
          displayResultDetails(result);
        });
      }
    }


    function displayResultDetails(result) {

      selectedResultPanel.innerHTML = getResultLabel(result);

      resultDetailsTable.innerHTML = "";
      _createPropertyRow(result, "address", false);
      _createPropertyRow(result, "attributes", true);
      _createPropertyRow(result, "extent", true);
      _createPropertyRow(result, "location", true);
      _createPropertyRow(result, "score", false);

    }

    function _createPropertyRow(object, propertyName, isObject) {

      const property_row = document.createElement("tr");
      resultDetailsTable.appendChild(property_row);

      const name_cell = document.createElement("td");
      name_cell.innerHTML = propertyName;
      property_row.appendChild(name_cell);

      const value_cell = document.createElement("td");
      value_cell.innerHTML = isObject ? JSON.stringify(object[propertyName], null, "  ") : object[propertyName];
      property_row.appendChild(value_cell);

    }

    function searchSuggestion(suggestion) {

      esriGeocoder.addressToLocations(suggestion).then((suggestionResults) => {
        displayResults(suggestionResults, "Results", false);
      });

    }

    function search() {

      if(searchInput.value.length > minCharacterInput) {

        const geocodeOptions = {
          forStorage: false,
          countryCode: "US",
          maxLocations: 5,
          address: {
            singleLine: searchInput.value
          }
        };

        esriGeocoder.addressToLocations(geocodeOptions).then((suggestionResults) => {
          displayResults(suggestionResults, "Results", false);
        });

      } else {
        inputUpdate();
      }
    }

    function suggest() {
      if(searchInput.value.length > minCharacterInput) {

        esriGeocoder.suggestLocations({ text: searchInput.value }).then((suggestionResults) => {
          displayResults(suggestionResults, "Suggestions...", true);
        });

      }
    }


    // SEARCH INPUT AND BUTTON EVENTS //
    calcite.addEvent(searchInput, "input", inputUpdate);
    calcite.addEvent(searchInput, "keyup", (evt) => {
      if(evt.keyCode === 13) {search(); }
    });
    calcite.addEvent(searchBtn, "click", search);

  });

});