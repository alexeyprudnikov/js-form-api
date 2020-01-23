/**
 * Form generator class
 * @author: Alexey Prudnikov <alexey.prudnikov@yahoo.de>
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
            HtmlGenerator.createInputElement('text', 'number', '', 'Auftragsnummer / Lieferscheinnummer', true)
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
            let formData = new FormData(formElement);

            let apiObj = new Api(this.apiUrl);

            // define request callback
            this.callbackSimple = (json) => {
                this.popoverElement.update(json);
            };

            apiObj.get('/users', { number: formData.get('number'), plz: formData.get('plz')}, this.callbackSimple);
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

        let formElement = HtmlGenerator.createTagElement('form', '', {action: '', method: 'get'});

        formElement.appendChild(
            HtmlGenerator.createTagElement('h2', 'Detailsuche')
        );
        formElement.appendChild(
            HtmlGenerator.createTagElement('br')
        );
        formElement.appendChild(
            HtmlGenerator.createInputElement('text', 'name', '', 'Benutzername (optional)')
        );
        formElement.appendChild(
            HtmlGenerator.createTagElement('br')
        );
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
                let tableElement = tableObj.generate(json);
                this.tableContainer.appendChild(tableElement);

                // show table
                if(this.tableBlock) {
                    this.tableBlock.getElementsByTagName('h2')[0].innerHTML = 'Schönen guten Tag, Max Mustermann';
                    this.tableBlock.style.display = 'block';
                }
            };

            apiObj.post('/auth/login',{ name: formData.get('name'), company_number: formData.get('customer'), password: formData.get('password')}, this.callbackDetail);

            // table info event
            document.onclick = (event) => {
                if(event.target.tagName === "A" && event.target.getAttribute('data-number')){
                    event.preventDefault();

                    // define request callback
                    this.callbackSimple = (json) => {
                        this.popoverElement.update(json);
                    };

                    let number = event.target.getAttribute('data-number');
                    apiObj.get('/tracking',{ number: number}, this.callbackSimple);
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
     * @param params
     * @param callback
     */
    get(endpoint = '', params = {}, callback) {
        let query = Object.keys(params)
            .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
            .join('&');

        let url = this.apiUrl + endpoint + '?' + query;

        fetch(url)
        .then((response) => response.json())
        .then((output) => {
            //console.log(output);
            callback(output);
        })
        .catch((error) => {
            alert('Error:' + error);
        });
    }

    /**
     *
     * @param endpoint
     * @param params
     * @param callback
     */
    post(endpoint = '', params = {}, callback) {
        let url = this.apiUrl + endpoint;

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        })
            .then((response) => response.json())
            .then((output) => {
                //console.log(output);
                callback(output);
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
     * @param json
     * @returns {HTMLElement}
     */
    generate(json) {
        let tableElement = HtmlGenerator.createTagElement('table');

        let tr = HtmlGenerator.createTagElement('tr');
        tr.appendChild(HtmlGenerator.createTagElement('th', 'Bestellt'));
        tr.appendChild(HtmlGenerator.createTagElement('th', 'Lieferscheinnummer'));
        tr.appendChild(HtmlGenerator.createTagElement('th', 'Ihre Bestellung'));
        tr.appendChild(HtmlGenerator.createTagElement('th', 'Auftragsnummer'));
        tr.appendChild(HtmlGenerator.createTagElement('th', 'Details'));

        tableElement.appendChild(tr);

        let dataArray = JSON.parse(json);
        
        for(let dataSet of dataArray) {
            let tr = HtmlGenerator.createTagElement('tr');
            let lNumber = 0;
            for(let key in dataSet) {
                if(key === 'lnumber') {
                    lNumber = dataSet[key];
                }
                tr.appendChild(HtmlGenerator.createTagElement('td', dataSet[key]));
            }
            let infoLink = HtmlGenerator.createTagElement('a', 'show info', {href: '#', 'data-number': lNumber});
            tr.appendChild(HtmlGenerator.createTagElement('td').appendChild(infoLink));
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
        let headerElement = HtmlGenerator.createTagElement('h2', 'Lieferscheinnummer: XXX');

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

    update(json = {}, header = '') {

        if(!this.container) {
            this.generate();
        }

        let innerContainer = document.getElementById('popOverInner');
        if(header) {
            innerContainer.getElementsByTagName('h2')[0].innerHTML = header;
        }
        document.getElementById('popOverContent').innerHTML = JSON.stringify(json);
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
