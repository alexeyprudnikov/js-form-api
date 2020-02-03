/**
 * Form generator class
 * @author: Alexey Prudnikov <aprudnikov@neusta.de>
 */

class Form {
    /**
     *
     * @param config
     */
    constructor(config) {
        this.initialize(config);
    }

    /**
     *
     * @param config
     */
    initialize(config) {
        this.formBlock = document.getElementById(config.fB);
        this.tableBlock = document.getElementById(config.tB);
        this.simpleFormContainer = document.getElementById(config.sfC);
        this.detailFormContainer = document.getElementById(config.dfC);
        this.tableContainer = document.getElementById(config.tC);
        this.paginationContainer = document.getElementById(config.pC);

        // remove slash on the end, all endpoint with slash: /users
        let apiUrl = config.apiUrl;
        this.apiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;

        this.popoverElement = new Popover();
    }

    /**
     * simple form generator - schnellsuche
     * @returns {boolean}
     */
    generateSimple() {

        if(!this.validateSimple()) {
            return false;
        }

        let formElement = HtmlGenerator.createTagElement('form', '', {action: '', method: 'get'});

        formElement.appendChild(
            HtmlGenerator.createTagElement('h2', 'Schnellsuche')
        );
        formElement.appendChild(
            HtmlGenerator.createTagElement('br')
        );
        formElement.appendChild(
            HtmlGenerator.createInputElement('text', 'number', '', 'Lieferscheinnummer', true)
        );
        formElement.appendChild(
            HtmlGenerator.createTagElement('br')
        );
        formElement.appendChild(
            HtmlGenerator.createInputElement('text', 'plz', '', 'Ziel-Postleitzahl', true)
        );
        formElement.appendChild(
            HtmlGenerator.createTagElement('br')
        );
        formElement.appendChild(
            HtmlGenerator.createInputElement('submit', 'submit', 'Suchen')
        );
        formElement.appendChild(
            HtmlGenerator.createInputElement('reset', 'reset', 'Löschen')
        );

        // request event
        formElement.onsubmit = (event) => {
            event.preventDefault();

            // lock form
            this.lockUnlock(formElement, 'lock');

            let formData = new FormData(formElement);

            let apiObj = new Api(this.apiUrl);

            // define request callback
            this.callbackSimple = (json) => {
                let header = 'Lieferscheinnummer: ' + formData.get('number');
                let html = OutputDecorator.getShipmentData(json);
                this.popoverElement.update(header, html);
                // unlock form
                this.lockUnlock(formElement);
            };

            let endpoint = '/delivery/' + formData.get('number') + '/zip/' + formData.get('plz');
            apiObj.get(endpoint, '', this.callbackSimple);
        };

        this.simpleFormContainer.appendChild(formElement);
    }

    /**
     *
     * @returns {boolean}
     */
    validateSimple() {
        if(!this.apiUrl) {
            alert('Error: api url not defined.');
            return false;
        }
        if(!this.simpleFormContainer) {
            alert('Error: simple form container not found.');
            return false;
        }
        return true;
    }

    /**
     * detail form generator - detailsuche
     * @returns {boolean}
     */
    generateDetail() {

        if(!this.validateDetail()) {
            return false;
        }

        this.apiToken = '';
        this.companyName = 'Nutzer';
        this.companyNumber = 0;
        this.activePage = 1;
        this.headerSet = false;

        let formElement = HtmlGenerator.createTagElement('form', '', {action: '', method: 'get'});

        formElement.appendChild(
            HtmlGenerator.createTagElement('h2', 'Detailsuche')
        );
        formElement.appendChild(
            HtmlGenerator.createTagElement('br')
        );
        /*
        formElement.appendChild(
            HtmlGenerator.createInputElement('text', 'name', '', 'Benutzername (optional)')
        );
        formElement.appendChild(
            HtmlGenerator.createTagElement('br')
        );
        */
        formElement.appendChild(
            HtmlGenerator.createInputElement('text', 'company_number', '', 'Kundennummer', true)
        );
        formElement.appendChild(
            HtmlGenerator.createTagElement('br')
        );
        formElement.appendChild(
            HtmlGenerator.createInputElement('password', 'password', '', 'Passwort', true)
        );
        formElement.appendChild(
            HtmlGenerator.createTagElement('br')
        );
        formElement.appendChild(
            HtmlGenerator.createInputElement('submit', 'submit', 'Anmelden')
        );
        formElement.appendChild(
            HtmlGenerator.createInputElement('reset', 'reset', 'Löschen')
        );

        // request event
        formElement.onsubmit = (event) => {
            event.preventDefault();
            let formData = new FormData(formElement);

            let apiObj = new Api(this.apiUrl);

            // define request callback
            this.callbackDetail = (json) => {
                // hide forms
                if(this.formBlock) {
                    this.formBlock.style.display = 'none';
                }

                let tableObj = new Table();

                if('data' in json) {
                    let dataSet = json.data;
                    // generate table
                    let tableElement = tableObj.generate(dataSet);
                    if(this.tableContainer) {
                        this.tableContainer.innerHTML = '';
                        this.tableContainer.appendChild(tableElement);
                    }
                }

                // show table
                if(this.tableBlock) {
                    // set header
                    if(this.headerSet === false) {
                        this.tableBlock.getElementsByTagName('h2')[0].innerHTML = 'Schönen guten Tag ' + this.companyName;
                        this.tableBlock.getElementsByTagName('p')[0].innerHTML = 'Ihre Kundennummer: <b>' + this.companyNumber + '</b>';
                        this.headerSet = true;
                    }
                    // pagination
                    if(this.paginationContainer) {
                        this.activePage = json.current_page;
                        if(json.last_page > 1) {
                            this.paginationContainer.getElementsByTagName('span')[0].innerHTML = 'Seite ' + json.current_page + '/' + json.last_page;

                            this.paginationContainer.getElementsByTagName('a')[0].setAttribute('data-page', '1');
                            this.paginationContainer.getElementsByTagName('a')[1].setAttribute('data-page', (json.current_page === 1 ) ? '1' : json.current_page - 1);
                            this.paginationContainer.getElementsByTagName('a')[2].setAttribute('data-page', (json.current_page === json.last_page) ? json.last_page : json.current_page + 1);
                            this.paginationContainer.getElementsByTagName('a')[3].setAttribute('data-page', json.last_page);

                            if(json.current_page === 1) {
                                this.paginationContainer.getElementsByTagName('a')[0].classList.add('inactive');
                                this.paginationContainer.getElementsByTagName('a')[1].classList.add('inactive');
                            } else {
                                this.paginationContainer.getElementsByTagName('a')[0].classList.remove('inactive');
                                this.paginationContainer.getElementsByTagName('a')[1].classList.remove('inactive');
                            }
                            if(json.current_page === json.last_page) {
                                this.paginationContainer.getElementsByTagName('a')[2].classList.add('inactive');
                                this.paginationContainer.getElementsByTagName('a')[3].classList.add('inactive');
                            } else {
                                this.paginationContainer.getElementsByTagName('a')[2].classList.remove('inactive');
                                this.paginationContainer.getElementsByTagName('a')[3].classList.remove('inactive');
                            }
                        }
                    }
                    this.tableBlock.style.display = 'block';
                }
            };

            // define auth callback
            this.callbackAuth = (data) => {
                this.apiToken = data.api_token;
                this.companyName = data.company.company_name;
                this.companyNumber = data.company.company_number;
                apiObj.get('/delivery', this.apiToken, this.callbackDetail);
            };

            // auth request
            let params = 'company_number=' + formData.get('company_number') + '&password=' + formData.get('password');
            apiObj.auth('/auth/login', params, this.callbackAuth);

            // table info event
            document.onclick = (event) => {
                // info popup
                if(event.target.tagName === "A" && event.target.getAttribute('data-number')){
                    event.preventDefault();

                    let number = event.target.getAttribute('data-number');

                    // define request callback
                    this.callbackSimple = (json) => {
                        let header = 'Lieferscheinnummer: ' + number;
                        let html = OutputDecorator.getShipmentData(json);
                        this.popoverElement.update(header, html);
                    };

                    let endpoint = '/delivery/' + number;
                    apiObj.get(endpoint, this.apiToken, this.callbackSimple);
                }
                // pagination
                if(event.target.tagName === "A" && event.target.getAttribute('data-page')){
                    event.preventDefault();

                    let page = event.target.getAttribute('data-page');

                    if(parseInt(page) === this.activePage) {
                        return;
                    }

                    let endpoint = '/delivery?page=' + page;
                    apiObj.get(endpoint, this.apiToken, this.callbackDetail);
                }
            };
        };

        this.detailFormContainer.appendChild(formElement);
    }

    /**
     *
     * @returns {boolean}
     */
    validateDetail() {
        if(!this.apiUrl) {
            alert('Error: api url not defined.');
            return false;
        }
        if(!this.detailFormContainer) {
            alert('Error: detail form container not found.');
            return false;
        }
        if(!this.tableContainer) {
            alert('Error: table container not found.');
            return false;
        }
        return true;
    }

    /**
     *
     * @param form
     * @param flag
     */
    lockUnlock(form, flag = '') {
        let inputs = form.querySelectorAll('input, select, textarea');
        if(flag === 'lock') {
            inputs.forEach(function(elem, index) {
                elem.setAttribute('readonly', true);
            });
        } else {
            inputs.forEach(function(elem, index) {
                elem.removeAttribute('readonly');
            });
        }
    }
}

class HtmlGenerator {
    /**
     *
     * @param tag
     * @param text
     * @param attributes
     * @returns {HTMLElement}
     */
    static createTagElement(tag, text = '', attributes = {}) {
        let tagElement = document.createElement(tag);

        if(text) {
            tagElement.innerHTML = text;
        }

        if(Object.keys(attributes).length > 0) {
            for(let key in attributes) {
                tagElement.setAttribute(key, attributes[key]);
            }
        }

        return tagElement;
    }

    /**
     *
     * @param type
     * @param name
     * @param value
     * @param placeholder
     * @param isRequired
     * @returns {HTMLElement}
     */
    static createInputElement(type, name, value = '', placeholder = '', isRequired = false) {
        let inputElement = document.createElement('input');
        inputElement.setAttribute('type', type);
        inputElement.setAttribute('name', name);
        if(value) {
            inputElement.setAttribute('value', value);
        }
        if(placeholder) {
            inputElement.setAttribute('placeholder', placeholder);
        }
        if(isRequired) {
            inputElement.setAttribute('required', '');
        }

        return inputElement;
    }
}

/**
 * Api class
 */

class Api {
    /**
     *
     * @param url
     */
    constructor(url) {
        this.apiUrl = url;
    }

    /**
     *
     * @param endpoint
     * @param api_token
     * @param callback
     */
    get(endpoint = '', api_token = '', callback) {
        let url = this.apiUrl + endpoint;

        if(api_token) {
            url += ((url.indexOf('?') === -1) ? '?' : '&') + 'api_token=' + api_token;
        }

        fetch(url)
            .then((response) => {
                if(response.status === 200) {
                    return response.json();
                }
                return {};
            })
            .then((json) => {
                //console.log(json);
                callback(json);
            })
            .catch((error) => {
                callback('Error:' + error);
            });
    }

    /**
     *
     * @param endpoint
     * @param params
     * @param callback
     */
    auth(endpoint = '', params = '', callback) {
        let url = this.apiUrl + endpoint;

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params
        })
            .then((response) => {
                if(response.status === 200) {
                    return response.json();
                }
                return {};
            })
            .then((json) => {
                if('data' in json && typeof json.data === 'object') {
                    //console.log(json.data.api_token);
                    callback(json.data);
                } else {
                    alert('Error: falsche Daten eingegeben!');
                }
            })
            .catch((error) => {
                alert('Error:' + error);
            });
    }
}

class Table {
    /**
     *
     */
    constructor() {

    }

    /**
     *
     * @param dataSet
     * @returns {HTMLElement}
     */
    generate(dataSet = []) {
        let tableElement = HtmlGenerator.createTagElement('table');

        let tr = HtmlGenerator.createTagElement('tr');
        tr.appendChild(HtmlGenerator.createTagElement('th', 'Bestellt'));
        tr.appendChild(HtmlGenerator.createTagElement('th', 'Lieferscheinnummer'));
        tr.appendChild(HtmlGenerator.createTagElement('th', 'Ihre Bestellung'));
        tr.appendChild(HtmlGenerator.createTagElement('th', 'Auftragsnummer'));
        tr.appendChild(HtmlGenerator.createTagElement('th', 'Details'));

        tableElement.appendChild(tr);

        for(let elem of dataSet) {
            let tr = HtmlGenerator.createTagElement('tr');

            tr.appendChild(HtmlGenerator.createTagElement('td', elem['shipping_note_date']));
            tr.appendChild(HtmlGenerator.createTagElement('td', elem['shipping_note_number']));
            tr.appendChild(HtmlGenerator.createTagElement('td', elem['id']));
            tr.appendChild(HtmlGenerator.createTagElement('td', elem['order_number']));

            let infoTD = HtmlGenerator.createTagElement('td');
            let infoLink = HtmlGenerator.createTagElement('a', '', {href: '#', 'data-number': elem['shipping_note_number']});
            infoTD.appendChild(infoLink);
            tr.appendChild(infoTD);
            tableElement.appendChild(tr);
        }

        return tableElement;
    }
}

class Popover {
    /**
     *
     */
    constructor() {
        this.containerId = 'popOver';
        this.generate();
    }

    generate() {

        this.container = document.getElementById(this.containerId);

        if(!this.container) {
            // main container
            this.container = HtmlGenerator.createTagElement('div', '', {id: this.containerId});
            document.querySelector('body').appendChild(this.container);
        } else {
            this.update();
            return;
        }

        // close button
        let closeOverlay = HtmlGenerator.createTagElement('a', '', {id: 'popOverOverlay', href: '#'});
        closeOverlay.onclick = (event) => {
            event.preventDefault();
            this.hide();
        };

        // inner container
        let innerContainer = HtmlGenerator.createTagElement('div', '', {id: 'popOverInner'});

        // cross
        let closeCross = HtmlGenerator.createTagElement('a', '', {href: '#'});
        closeCross.classList.add('btn-close');
        closeCross.onclick = (event) => {
            event.preventDefault();
            this.hide();
        };

        // header
        let headerElement = HtmlGenerator.createTagElement('h2', 'Informationen');

        // data
        let dataElement = HtmlGenerator.createTagElement('div', 'Loading...', {id: 'popOverContent'});

        // close button
        let closeButton = HtmlGenerator.createTagElement('a', 'Ok', {href: '#'});
        closeButton.onclick = (event) => {
            event.preventDefault();
            this.hide();
        };

        // append to inner container
        innerContainer.appendChild(closeCross);
        innerContainer.appendChild(headerElement);
        innerContainer.appendChild(dataElement);
        innerContainer.appendChild(closeButton);


        // append to main container
        this.container.appendChild(closeOverlay);
        this.container.appendChild(innerContainer);
    }

    update(header = '', html = '') {

        if(!this.container) {
            this.generate();
        }

        let innerContainer = document.getElementById('popOverInner');
        if(header) {
            innerContainer.getElementsByTagName('h2')[0].innerHTML = header;
        }
        if(html) {
            document.getElementById('popOverContent').innerHTML = html;
        }
        this.show();
    }

    show() {
        this.container.style.pointerEvents = 'auto';
        this.container.style.opacity = 1;
    }

    hide() {
        this.container.style.pointerEvents = 'none';
        this.container.style.opacity = 0;
    }
}

class OutputDecorator {

    /**
     *
     * @param data
     * @returns {string}
     */
    static getShipmentData(data) {
        let output = '';
        if(typeof data === 'string') {
            output += data;
        }
        if(typeof data === 'object' && 'order_number' in data) {
            output += OutputDecorator.translate('order_number') + ': <b>' + data.order_number + '</b>';
        }
        if('package_information' in data && typeof data.package_information === 'object') {
            for(let pkg of data.package_information) {
                output += '<br><br>';
                output += OutputDecorator.translate('package_information_tracking_number') + ': <b>' + pkg.tracking_number + '</b><br>';
                output += OutputDecorator.translate('package_information_status_date') + ': <b>' + pkg.status_date + '</b><br>';
                output += OutputDecorator.translate('package_information_shipping_carrier') + ': <b>' + pkg.shipping_carrier + '</b><br>';
                output += OutputDecorator.translate('package_information_status_text') + ':<br><b>' + pkg.status_text + '</b>';
            }
        }
        return output ? output : 'Keine Daten gefunden';
    }

    /**
     *
     * @param key
     * @returns {*}
     */
    static translate(key) {
        let translates = {
            order_number: 'Auftragsnummer',
            package_information_tracking_number: 'Ihre Sendungsverfolgungsnummer',
            package_information_status_date: 'Versendet am',
            package_information_shipping_carrier: 'Dienstleister',
            package_information_status_text: 'Letzter Status'
        };
        if(key in translates) {
            return translates[key];
        }
        return key;
    }
}
