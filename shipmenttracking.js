/**
 * Form generator class
 * @author: Alexey Prudnikov <aprudnikov@neusta.de>
 */

const DATA_TYPE_DELIVERY = 0;
const DATA_TYPE_USERS = 1;

const ROLE_ADMIN = 'admin';
const ROLE_COMPANY_OWNER = 'company_owner';
const ROLE_COMPANY_ADMIN = 'company_admin';

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
        let apiUrl = config.apiUrl.endsWith('/') ? config.apiUrl.slice(0, -1) : config.apiUrl;
        this.apiObj = new Api(apiUrl);

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
            HtmlGenerator.createInputElement('text', 'number', '', 'Auftragsnummer / Lieferscheinnummer', 'Auftragsnummer oder Lieferscheinnummer muss angegeben werden.')
        );
        formElement.appendChild(
            HtmlGenerator.createTagElement('br')
        );
        formElement.appendChild(
            HtmlGenerator.createInputElement('text', 'plz', '', 'Ziel-Postleitzahl', 'PLZ der Lieferadresse muss angegeben werden.')
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

            // validate required fields
            let errors = this.validateSubmit(formElement);
            if(errors.length > 0) {
                this.popoverElement.update('Fehler!', errors.join('</br>'));
                return false;
            }

            // lock form
            Form.lockUnlock(formElement, 'lock');

            let formData = new FormData(formElement);

            // define request callback
            this.callbackSimple = (json) => {
                let header = 'Lieferscheinnummer: ' + formData.get('number');
                let html = OutputDecorator.getShipmentData(json);
                this.popoverElement.update(header, html);
                // unlock form
                Form.lockUnlock(formElement);
            };

            let endpoint = '/delivery/' + formData.get('number') + '/zip/' + formData.get('plz');
            this.apiObj.get(endpoint, '', this.callbackSimple);
        };

        this.simpleFormContainer.appendChild(formElement);
    }

    /**
     *
     * @returns {boolean}
     */
    validateSimple() {
        if(!this.apiObj.getUrl()) {
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

        this.user = {};
        this.activePage = 1;
        this.responseType = DATA_TYPE_DELIVERY;
        this.headerSet = false;

        let formElement = HtmlGenerator.createTagElement('form', '', {action: '', method: 'post'});

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
            HtmlGenerator.createInputElement('text', 'company_number', '', 'Kundennummer', 'Kundennummer muss angegeben werden.')
        );
        formElement.appendChild(
            HtmlGenerator.createTagElement('br')
        );
        formElement.appendChild(
            HtmlGenerator.createInputElement('password', 'password', '', 'Passwort', 'Passwort muss angegeben werden.')
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

            // validate required fields
            let errors = this.validateSubmit(formElement);
            if(errors.length > 0) {
                this.popoverElement.update('Fehler!', errors.join('</br>'));
                return false;
            }

            // define request callback
            this.callbackDetail = (json) => {

                // hide forms
                if(this.formBlock) {
                    this.formBlock.style.display = 'none';
                }
                if(this.tableContainer) {
                    while (this.tableContainer.firstChild) {
                        this.tableContainer.firstChild.remove();
                    }
                }

                // check output table type - delivery or user
                if(json.path.indexOf('/users') !== -1) {
                    this.responseType = DATA_TYPE_USERS;
                }
                if(json.path.indexOf('/delivery') !== -1) {
                    this.responseType = DATA_TYPE_DELIVERY;
                }

                if(this.tableContainer) {
                    if(this.responseType === DATA_TYPE_DELIVERY && this.rights_isEditor()) {
                        this.tableContainer.appendChild(
                            HtmlGenerator.createInputElement('button', 'showUsers', 'Benutzerverwaltung')
                        );
                    }
                    if(this.responseType === DATA_TYPE_USERS) {
                        this.tableContainer.appendChild(
                            HtmlGenerator.createInputElement('button', 'showDelivery', 'Lieferungsübersicht')
                        );
                        if(this.rights_isEditor()) {
                            this.tableContainer.appendChild(
                                HtmlGenerator.createInputElement('button', 'addUser', 'Benutzer hinzufügen')
                            );
                        }
                    }
                    this.tableContainer.appendChild(
                        HtmlGenerator.createInputElement('button', 'editProfile', 'Profil')
                    );

                    let changePasswordButton = HtmlGenerator.createInputElement('button', 'changeUserPassword', 'Passwort ändern');
                    changePasswordButton.setAttribute('data-user-id', this.user.id);
                    this.tableContainer.appendChild(changePasswordButton);

                    this.tableContainer.appendChild(
                        HtmlGenerator.createInputElement('button', 'logOut', 'Ausloggen')
                    );
                    this.tableContainer.appendChild(
                        HtmlGenerator.createTagElement('br')
                    );
                    this.tableContainer.appendChild(
                        HtmlGenerator.createTagElement('br')
                    );
                }

                if('data' in json) {
                    let dataSet = json.data;
                    let isFusa = this.rights_isFuSa();
                    // generate table
                    let tableElement = Table.generate(dataSet, this.responseType, this.user.id, isFusa);
                    if(this.tableContainer) {
                        this.tableContainer.appendChild(tableElement);
                    }
                }

                // show table
                if(this.tableBlock) {
                    // set header
                    if(this.headerSet === false) {
                        this.tableBlock.getElementsByTagName('h2')[0].innerHTML = 'Schönen guten Tag ' + this.user.company.company_name;
                        this.tableBlock.getElementsByTagName('p')[0].innerHTML = 'Ihre Kundennummer: <b>' + this.user.company.company_number + '</b>';
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
                        } else {
                            this.paginationContainer.getElementsByTagName('span')[0].innerHTML = 'Seite 1/1';
                            let aElements = this.paginationContainer.querySelectorAll('a');
                            aElements.forEach(function(elem, index) {
                                elem.removeAttribute('data-page');
                                if(elem.classList.contains('inactive') === false) {
                                    elem.classList.add('inactive');
                                }
                            });
                        }
                    }
                    this.tableBlock.style.display = 'block';
                }

                // unlock form
                Form.lockUnlock(formElement);
            };

            // define auth callback
            this.callbackAuthSuccess = (user) => {
                this.user = user;
                this.apiObj.get('/delivery', this.user.api_token, this.callbackDetail);
            };

            this.callbackAuthError = (text) => {
                this.popoverElement.update('Fehler!', text);
                // unlock form
                Form.lockUnlock(formElement);
            };

            this.callbackPopupUpdate = (text) => {
                this.popoverElement.initButtons();
                this.popoverElement.update(null, text);
            };

            this.callbackUserListReload = (text) => {
                this.popoverElement.initButtons();
                this.popoverElement.update(null, text);
                this.apiObj.get('/users', this.user.api_token, this.callbackDetail);
            };

            // lock form
            Form.lockUnlock(formElement, 'lock');

            let formData = new FormData(formElement);

            // auth request
            let params = (formData.get('name') ? 'name=' + formData.get('name') + '&' : '') + 'company_number=' + formData.get('company_number') + '&password=' + formData.get('password');

            this.apiObj.auth('/auth/login', params, this.callbackAuthSuccess, this.callbackAuthError);

            // table info event
            this.tableBlock.onclick = (event) => {
                this.eventHandler(event);
            };
        };

        this.detailFormContainer.appendChild(formElement);
    }

    /**
     *
     * @returns {boolean}
     */
    rights_isEditor() {
        return !!this.user.has_editing_rights;
    }

    /**
     *
     * @returns {boolean}
     */
    rights_isOwner() {
        return (this.user.role === ROLE_COMPANY_OWNER);
    }

    /**
     *
     * @returns {boolean}
     */
    rights_isAdmin() {
        return (this.user.role === ROLE_ADMIN || this.user.role === ROLE_COMPANY_ADMIN);
    }

    /**
     *
     * @returns {boolean}
     */
    rights_isFuSa() {
        return (this.user.role === ROLE_ADMIN);
    }

    /**
     *
     * @returns {boolean}
     */
    validateDetail() {
        if(!this.apiObj.getUrl()) {
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
     * @returns {Array}
     */
    validateSubmit(form) {
        let inputs = form.querySelectorAll('input, select, textarea');
        let errors = [];
        inputs.forEach(function(elem, index) {
            if(elem.getAttribute('data-alert-required') && elem.value === '') {
                errors.push(elem.getAttribute('data-alert-required'));
            }
        });
        return errors;
    }

    /**
     *
     * @param form
     * @param flag
     */
    static lockUnlock(form, flag = '') {
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

    /**
     *
     * @param event
     */
    eventHandler(event) {
        // info delivery popup
        if(event.target.tagName === "A" && event.target.getAttribute('data-number')){
            event.preventDefault();
            let number = event.target.getAttribute('data-number');
            this.event_deliveryInfo(number);
        }
        // info user popup
        if(event.target.tagName === "A" && event.target.getAttribute('data-user-id')){
            event.preventDefault();
            let userId = event.target.getAttribute('data-user-id');
            this.event_userInfo(userId);
        }
        // pagination
        if(event.target.tagName === "A" && event.target.getAttribute('data-page')){
            event.preventDefault();
            let page = event.target.getAttribute('data-page');
            this.event_Pagination(page);
        }
        // buttons
        if(event.target.tagName === "INPUT" && event.target.getAttribute('type') === 'button') {
            event.preventDefault();
            let buttonName = event.target.getAttribute('name');
            let userId = event.target.getAttribute('data-user-id');
            switch(buttonName) {
                case 'showUsers':
                    this.event_showUsers();
                    break;
                case 'showDelivery':
                    this.event_showDelivery();
                    break;
                case 'changeUserPassword':
                    this.event_changeUserPassword(userId);
                    break;
                case 'setUserEditor':
                    let isUserEditor = parseInt(event.target.getAttribute('data-user-editor'));
                    this.event_setUserEditor(userId, isUserEditor);
                    break;
                case 'deactivateUser':
                    let userDeactivated = (parseInt(event.target.getAttribute('data-user-active')) === 0);
                    this.event_deactivateUser(userId, userDeactivated);
                    break;
                case 'addUser':
                    this.event_addUser();
                    break;
                case 'editProfile':
                    this.event_editCreateProfile();
                    break;
                case 'logOut':
                    this.event_logOut();
                    break;
            }
        }
    }

    /**
     *
     * @param number
     */
    event_deliveryInfo(number) {
        // define request callback
        this.callbackSimple = (json) => {
            let header = 'Lieferscheinnummer: ' + number;
            let html = OutputDecorator.getShipmentData(json);
            this.popoverElement.update(header, html);
        };

        let endpoint = '/delivery/' + number;
        this.apiObj.get(endpoint, this.user.api_token, this.callbackSimple);
    }

    /**
     *
     * @param userId
     */
    event_userInfo(userId) {
        // define request callback
        this.callbackSimple = (json) => {
            let header = 'Benutzerinformationen';
            let html = OutputDecorator.getUserData(json);
            this.popoverElement.update(header, html);
        };

        let endpoint = '/users/' + userId;
        this.apiObj.get(endpoint, this.user.api_token, this.callbackSimple);
    }

    /**
     *
     * @param page
     */
    event_Pagination(page) {
        if(parseInt(page) === this.activePage) {
            return;
        }
        let endpoint = (this.responseType === DATA_TYPE_USERS ? '/users' : '/delivery') + '?page=' + page;
        this.apiObj.get(endpoint, this.user.api_token, this.callbackDetail);
    }

    /**
     *
     */
    event_showUsers() {
        this.apiObj.get('/users', this.user.api_token, this.callbackDetail);
    }

    /**
     *
     */
    event_showDelivery() {
        this.apiObj.get('/delivery', this.user.api_token, this.callbackDetail);
    }

    /**
     *
     * @param userId
     */
    event_changeUserPassword(userId) {
        let formPasswordElement = HtmlGenerator.createTagElement('form', '', {action: '', method: 'post'});
        formPasswordElement.appendChild(
            HtmlGenerator.createInputElement('password', 'oldPassword', '', 'Altes Passwort', 'Altes Passwort muss angegeben werden.')
        );
        formPasswordElement.appendChild(
            HtmlGenerator.createTagElement('br')
        );
        formPasswordElement.appendChild(
            HtmlGenerator.createInputElement('password', 'newPassword', '', 'Neues Passwort', 'Neues Passwort muss angegeben werden.')
        );
        formPasswordElement.appendChild(
            HtmlGenerator.createTagElement('br')
        );
        formPasswordElement.appendChild(
            HtmlGenerator.createInputElement('password', 'newPasswordRepeat', '', 'Neues Passwort wiederholen', 'Neues Passwort muss wiederholt werden.')
        );

        let callbackSavePassword = () => {
            let endPoint = '/users/' + userId + '/password';
            let formData = new FormData(formPasswordElement);

            let oldPassword = formData.get('oldPassword');
            let newPassword = formData.get('newPassword');
            let newPasswordRepeat = formData.get('newPasswordRepeat');
            let errors = this.validateSubmit(formPasswordElement);
            if(newPassword !== '' && newPasswordRepeat !== '' && newPassword !== newPasswordRepeat) {
                errors.push('Die angegebenen Passwörter stimmen nicht überein.');
            }
            if(errors.length > 0) {
                if(formPasswordElement.querySelector('div[class=errorAlert]')) {
                    formPasswordElement.querySelector('div[class=errorAlert]').remove();
                }
                formPasswordElement.prepend(
                    HtmlGenerator.createTagElement('div', errors.join('</br>') + '<br><br>', {'class': 'errorAlert'})
                );
                return false;
            }

            let params = 'oldpassword=' + oldPassword + '&newpassword=' + newPassword + '&api_token=' + this.user.api_token;

            this.apiObj.editPassword(endPoint, params, this.callbackPopupUpdate);
        };

        this.popoverElement.setButtons({'Speichern': callbackSavePassword, 'Abbrechen': this.popoverElement.hide});
        let header = (parseInt(userId) === parseInt(this.user.id)) ? 'Eigenes Passwort ändern' : 'Passwort festlegen';
        this.popoverElement.update(header, formPasswordElement);
    }

    /**
     *
     * @param userId
     * @param isUserEditor
     */
    event_setUserEditor(userId, isUserEditor) {
        let txtEditor = isUserEditor === 1 ? 'entziehen' : 'erteilen';
        let btnEditor = txtEditor.charAt(0).toUpperCase() + txtEditor.slice(1);

        let callbackSetUserEditor = () => {
            let endPoint = '/users/' + userId + '/change-role';
            this.apiObj.setUserEditor(endPoint, this.user.api_token, isUserEditor, this.callbackUserListReload)
        };

        this.popoverElement.setButtons({[btnEditor]: callbackSetUserEditor, 'Abbrechen': this.popoverElement.hide});
        this.popoverElement.update('Benutzerverwaltung', 'Möchten Sie dem Benutzer die Benutzerverwaltungsrechte ' + txtEditor + '?');
    }

    /**
     *
     * @param userId
     * @param userDeactivated
     */
    event_deactivateUser(userId, userDeactivated) {
        let txtLock = userDeactivated ? 'entsperren' : 'sperren';
        let btnLock = txtLock.charAt(0).toUpperCase() + txtLock.slice(1);

        let callbackDeactivateUser = () => {
            let endPoint = '/users/' + userId + (userDeactivated ? '/activate' : '/deactivate');
            this.apiObj.deactivateUser(endPoint, this.user.api_token, this.callbackUserListReload)
        };

        this.popoverElement.setButtons({[btnLock]: callbackDeactivateUser, 'Abbrechen': this.popoverElement.hide});
        this.popoverElement.update('Konto-Sperrstatus', 'Möchten Sie den Benutzer wirklich ' + txtLock + '?');
    }

    /**
     *
     */
    event_addUser() {
        this.event_editCreateProfile(true);
    }

    /**
     *
     */
    event_editCreateProfile(isNew = false) {
        let formProfileElement = HtmlGenerator.createTagElement('form', '', {action: '', method: 'post'});
        if(isNew && this.rights_isFuSa()) {
            formProfileElement.appendChild(
                HtmlGenerator.createTagElement('div', OutputDecorator.translate('company_number') + ':')
            );
            formProfileElement.appendChild(
                HtmlGenerator.createInputElement('text', 'companyNumber', this.user.company.company_number, OutputDecorator.translate('company_number'), 'Kundennummer muss angegeben werden.')
            );
        } else {
            formProfileElement.appendChild(
                HtmlGenerator.createTagElement('div', OutputDecorator.translate('company_number') + ': <b>' + this.user.company.company_number + '</b>')
            );
            formProfileElement.appendChild(
                HtmlGenerator.createTagElement('div', OutputDecorator.translate('company_name') + ': <b>' + this.user.company.company_name + '</b>')
            );
        }
        formProfileElement.appendChild(
            HtmlGenerator.createTagElement('br')
        );
        if(isNew || this.user.name) {
            formProfileElement.appendChild(
                HtmlGenerator.createTagElement('div', OutputDecorator.translate('user_name') + ':')
            );
            formProfileElement.appendChild(
                HtmlGenerator.createInputElement('text', 'name', isNew ? '' : this.user.name, OutputDecorator.translate('user_name'), 'Benutzername muss angegeben werden.')
            );
            formProfileElement.appendChild(
                HtmlGenerator.createTagElement('br')
            );
        }
        if(isNew || this.user.email) {
            formProfileElement.appendChild(
                HtmlGenerator.createTagElement('div', OutputDecorator.translate('user_email') + ':')
            );
            formProfileElement.appendChild(
                HtmlGenerator.createInputElement('text', 'email', isNew ? '' : this.user.email, OutputDecorator.translate('user_email'), 'Email-Adresse muss angegeben werden.')
            );
            formProfileElement.appendChild(
                HtmlGenerator.createTagElement('br')
            );
        }
        if(isNew) {
            formProfileElement.appendChild(
                HtmlGenerator.createTagElement('div','Passwort:')
            );
            formProfileElement.appendChild(
                HtmlGenerator.createInputElement('password', 'password', '', 'Passwort', 'Passwort muss angegeben werden.')
            );
            formProfileElement.appendChild(
                HtmlGenerator.createTagElement('div','Passwort wiederholen:')
            );
            formProfileElement.appendChild(
                HtmlGenerator.createInputElement('password', 'passwordRepeat', '', 'Passwort wiederholen', 'Passwort muss wiederholt werden.')
            );
            formProfileElement.appendChild(
                HtmlGenerator.createTagElement('br')
            );
        }
        // checkbox
        formProfileElement.appendChild(
            HtmlGenerator.createTagElement('span', OutputDecorator.translate('user_has_editing_rights') + ': ')
        );
        let editorCheckbox = HtmlGenerator.createInputElement('checkbox', 'isEditor', 1);
        if(isNew !== true) {
            if(this.user.has_editing_rights) {
                editorCheckbox.setAttribute('checked', 'checked');
            }
            editorCheckbox.setAttribute('disabled', 'disabled');
        }
        formProfileElement.appendChild(editorCheckbox);
        formProfileElement.appendChild(
            HtmlGenerator.createTagElement('span', ' ja')
        );

        let callbackSaveProfile = () => {
            let formData = new FormData(formProfileElement);

            let profileName = formData.get('name');
            let profileEmail = formData.get('email');
            let profilePassword = formData.get('password');
            let errors = this.validateSubmit(formProfileElement);
            if(isNew) {
                let profilePasswordRepeat = formData.get('passwordRepeat');
                if(profilePassword !== '' && profilePasswordRepeat !== '' && profilePassword !== profilePasswordRepeat) {
                    errors.push('Die angegebenen Passwörter stimmen nicht überein.');
                }
            }
            if(errors.length > 0) {
                if(formProfileElement.querySelector('div[class=errorAlert]')) {
                    formProfileElement.querySelector('div[class=errorAlert]').remove();
                }
                formProfileElement.prepend(
                    HtmlGenerator.createTagElement('div', errors.join('</br>') + '<br><br>', {'class': 'errorAlert'})
                );
                return false;
            }

            if(isNew) {
                let endPoint = '/users';
                let companyNumber = this.rights_isFuSa() ? formData.get('companyNumber') : this.user.company.company_number;
                let isEditor = formData.get('isEditor');
                let params = 'company_number=' + companyNumber + '&name=' + profileName + '&email=' + profileEmail + '&has_editing_rights=' + isEditor + '&password=' + profilePassword + '&api_token=' + this.user.api_token;
                this.apiObj.createUser(endPoint, params, this.callbackPopupUpdate);
            } else {
                let endPoint = '/users/' + this.user.id;
                let params = 'name=' + profileName + '&email=' + profileEmail + '&password=1&api_token=' + this.user.api_token;
                this.apiObj.editUser(endPoint, params, this.callbackPopupUpdate);
            }
        };

        this.popoverElement.setButtons({'Speichern': callbackSaveProfile, 'Abbrechen': this.popoverElement.hide});
        let header = isNew ? 'Benutzer hinzufügen' : 'Profil';
        this.popoverElement.update(header, formProfileElement);
    }

    /**
     *
     */
    event_logOut() {
        this.user = {};
        if(this.tableContainer) {
            while (this.tableContainer.firstChild) {
                this.tableContainer.firstChild.remove();
            }
        }
        if(this.paginationContainer) {
            this.paginationContainer.getElementsByTagName('span')[0].innerHTML = 'Seite 1/1';
            let aElements = this.paginationContainer.querySelectorAll('a');
            aElements.forEach(function(elem, index) {
                elem.removeAttribute('data-page');
                if(elem.classList.contains('inactive') === false) {
                    elem.classList.add('inactive');
                }
            });
        }
        if(this.detailFormContainer) {
            let inputDetails = this.detailFormContainer.querySelectorAll('input[type=password]');
            inputDetails.forEach(function(elem, index) {
                elem.value = '';
            });
        }
        if(this.tableBlock) {
            this.headerSet = false;
            this.tableBlock.getElementsByTagName('h2')[0].innerHTML = '';
            this.tableBlock.getElementsByTagName('p')[0].innerHTML = '';
            this.tableBlock.style.display = 'none';
        }
        if(this.formBlock) {
            this.formBlock.style.display = 'block';
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
                if(attributes.hasOwnProperty(key)) {
                    tagElement.setAttribute(key, attributes[key]);
                }
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
     * @param alertRequired
     * @returns {HTMLElement}
     */
    static createInputElement(type, name, value = '', placeholder = '', alertRequired = '') {
        let inputElement = document.createElement('input');
        inputElement.setAttribute('type', type);
        inputElement.setAttribute('name', name);
        if(value) {
            inputElement.setAttribute('value', value);
        }
        if(placeholder) {
            inputElement.setAttribute('placeholder', placeholder);
        }
        if(alertRequired) {
            inputElement.setAttribute('data-alert-required', alertRequired);
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
     * @returns {*}
     */
    getUrl() {
        return this.apiUrl;
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
                callback('Fehler! ' + error);
            });
    }

    /**
     *
     * @param endpoint
     * @param api_token
     * @param callback
     */
    deactivateUser(endpoint = '', api_token = '', callback) {
        let url = this.apiUrl + endpoint;

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'api_token=' + api_token
        })
            .then((response) => {
                return response.text();
            })
            .then((text) => {
                callback(text);
            })
            .catch((error) => {
                callback('Fehler! ' + error);
            });
    }

    /**
     *
     * @param endpoint
     * @param api_token
     * @param has_editing_rights
     * @param callback
     */
    setUserEditor(endpoint = '', api_token = '', has_editing_rights = 1, callback) {
        let url = this.apiUrl + endpoint;

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'api_token=' + api_token + '&has_editing_rights=' + (1 - has_editing_rights)
        })
            .then((response) => {
                return response.json();
            })
            .then((json) => {
                let response = '';
                if(json.message && json.errors) {
                    response = 'Fehler!';
                    response += '<br>';
                    response += json.message;
                    if('has_editing_rights' in json.errors) {
                        response += '<br>';
                        response += json.errors.has_editing_rights;
                    }
                } else {
                    response = 'Die gewünschten Änderungen wurden erfolgreich gespeichert.';
                }
                callback(response);
            })
            .catch((error) => {
                callback('Fehler! ' + error);
            });
    }

    /**
     *
     * @param endpoint
     * @param params
     * @param callback
     */
    createUser(endpoint = '', params = '', callback) {
        let url = this.apiUrl + endpoint;

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params
        })
            .then((response) => {
                return response.json();
            })
            .then((json) => {
                let response = '';
                if(json.message && json.errors) {
                    response = 'Fehler!';
                    if('name' in json.errors) {
                        response += '<br>';
                        response += json.errors.name[0];
                    }
                    if('email' in json.errors) {
                        response += '<br>';
                        response += json.errors.email[0];
                    }
                } else {
                    response = 'Neuer Benutzer <b>' + json.data.name + '</b> [' + json.data.email + '] wurde erfolgreich hinzufügt.';
                }
                callback(response);
            })
            .catch((error) => {
                callback('Fehler! ' + error);
            });
    }

    /**
     *
     * @param endpoint
     * @param params
     * @param callback
     */
    editPassword(endpoint = '', params = '', callback) {
        let url = this.apiUrl + endpoint;

        fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params
        })
            .then((response) => {
                return response.json();
            })
            .then((json) => {
                let response = '';
                if(json.message) {
                    response = 'Fehler!';
                    response += '<br>';
                    response += 'Ihnen fehlt die Berechtigung, den Vorgang abzuschließen.';
                    response += '<br>';
                    response += json.message + '.';
                } else {
                    response = 'Die gewünschten Änderungen wurden erfolgreich gespeichert.';
                }
                callback(response);
            })
            .catch((error) => {
                callback('Fehler! ' + error);
            });
    }

    /**
     *
     * @param endpoint
     * @param params
     * @param callback
     */
    editUser(endpoint = '', params = '', callback) {
        let url = this.apiUrl + endpoint;

        fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params
        })
            .then((response) => {
                return response.json();
            })
            .then((json) => {
                let response = '';
                if(json.message && json.errors) {
                    response = 'Fehler!';
                    if('name' in json.errors) {
                        response += '<br>';
                        response += json.errors.name[0];
                    }
                    if('email' in json.errors) {
                        response += '<br>';
                        response += json.errors.email[0];
                    }
                } else {
                    response = 'Die gewünschten Änderungen wurden erfolgreich gespeichert.';
                }
                callback(response);
            })
            .catch((error) => {
                callback('Fehler! ' + error);
            });
    }

    /**
     *
     * @param endpoint
     * @param params
     * @param callbackSuccess
     * @param callbackError
     */
    auth(endpoint = '', params = '', callbackSuccess, callbackError) {
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
                    callbackSuccess(json.data);
                } else {
                    callbackError('Login fehlerhaft - bitte Eingaben prüfen.');
                }
            })
            .catch((error) => {
                callbackError(error);
            });
    }
}

class Table {

    /**
     *
     * @param dataSet
     * @param type
     * @param userId
     * @param isFuSa
     * @returns {HTMLElement}
     */
    static generate(dataSet = [], type = DATA_TYPE_DELIVERY, userId = 0, isFuSa = false) {

        let tableElement = HtmlGenerator.createTagElement('table');

        let tr = HtmlGenerator.createTagElement('tr');

        if(type === DATA_TYPE_DELIVERY) {
            if(isFuSa) {
                tr.appendChild(HtmlGenerator.createTagElement('th', 'Kunde'));
            }
            tr.appendChild(HtmlGenerator.createTagElement('th', 'Bestellt'));
            tr.appendChild(HtmlGenerator.createTagElement('th', 'Lieferscheinnummer'));
            tr.appendChild(HtmlGenerator.createTagElement('th', 'Ihre Bestellung'));
            tr.appendChild(HtmlGenerator.createTagElement('th', 'Auftragsnummer'));
            tr.appendChild(HtmlGenerator.createTagElement('th', 'Details'));
        }

        if(type === DATA_TYPE_USERS) {
            if(isFuSa) {
                tr.appendChild(HtmlGenerator.createTagElement('th', 'Nummer'));
                tr.appendChild(HtmlGenerator.createTagElement('th', 'Firma'));
            }
            tr.appendChild(HtmlGenerator.createTagElement('th', 'Name'));
            tr.appendChild(HtmlGenerator.createTagElement('th', 'E-Mail'));
            tr.appendChild(HtmlGenerator.createTagElement('th', 'Passwort'));
            tr.appendChild(HtmlGenerator.createTagElement('th', 'Benutzerverwaltung'));
            tr.appendChild(HtmlGenerator.createTagElement('th', 'Sperrstatus'));
            tr.appendChild(HtmlGenerator.createTagElement('th', 'Details'));
        }

        tableElement.appendChild(tr);

        for(let elem of dataSet) {
            let tr = HtmlGenerator.createTagElement('tr');

            if(type === DATA_TYPE_DELIVERY) {

                if(isFuSa) {
                    tr.appendChild(HtmlGenerator.createTagElement('td', elem['company_number'] + '<br>' + elem['company_name_1']));
                }

                tr.appendChild(HtmlGenerator.createTagElement('td', elem['shipping_note_date']));
                tr.appendChild(HtmlGenerator.createTagElement('td', elem['shipping_note_number']));
                tr.appendChild(HtmlGenerator.createTagElement('td', elem['id']));
                tr.appendChild(HtmlGenerator.createTagElement('td', elem['order_number']));

                let infoTD = HtmlGenerator.createTagElement('td');
                let infoLink = HtmlGenerator.createTagElement('a', '', {href: '#', 'data-number': elem['shipping_note_number']});
                infoTD.appendChild(infoLink);
                tr.appendChild(infoTD);
            }

            if(type === DATA_TYPE_USERS) {

                if(isFuSa) {
                    tr.appendChild(HtmlGenerator.createTagElement('td', elem['company']['company_number']));
                    tr.appendChild(HtmlGenerator.createTagElement('td', elem['company']['company_name']));
                }

                tr.appendChild(HtmlGenerator.createTagElement('td', elem['name'] ? elem['name'] : '-'));
                tr.appendChild(HtmlGenerator.createTagElement('td', elem['email'] ? elem['email'] : '-'));

                if(elem['id'] !== userId) {
                    let passwordUserTD = HtmlGenerator.createTagElement('td');
                    let passwordButton = HtmlGenerator.createInputElement('button', 'changeUserPassword', 'festlegen');
                    passwordButton.setAttribute('data-user-id', elem['id']);
                    passwordUserTD.appendChild(passwordButton);
                    tr.appendChild(passwordUserTD);

                    let editUserTD = HtmlGenerator.createTagElement('td');
                    let editUserButton = HtmlGenerator.createInputElement('button', 'setUserEditor', elem['has_editing_rights'] ? 'entziehen' : 'erteilen');
                    editUserButton.setAttribute('data-user-id', elem['id']);
                    editUserButton.setAttribute('data-user-editor', elem['has_editing_rights'] ? '1' : '0');
                    editUserTD.appendChild(editUserButton);
                    tr.appendChild(editUserTD);

                    let lockUserTD = HtmlGenerator.createTagElement('td');
                    let lockUserButton = HtmlGenerator.createInputElement('button', 'deactivateUser', elem['deactivated_at'] ? 'entsperren' : 'sperren');
                    lockUserButton.setAttribute('data-user-id', elem['id']);
                    lockUserButton.setAttribute('data-user-active', elem['deactivated_at'] ? '0' : '1');
                    lockUserTD.appendChild(lockUserButton);
                    tr.appendChild(lockUserTD);
                } else {
                    tr.appendChild(HtmlGenerator.createTagElement('td', '-'));
                    tr.appendChild(HtmlGenerator.createTagElement('td', '-'));
                    tr.appendChild(HtmlGenerator.createTagElement('td', '-'));
                }

                let infoTD = HtmlGenerator.createTagElement('td');
                let infoLink = HtmlGenerator.createTagElement('a', '', {href: '#', 'data-user-id': elem['id']});
                infoTD.appendChild(infoLink);
                tr.appendChild(infoTD);
            }

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
        this.initButtons();
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
        let contentContainer = HtmlGenerator.createTagElement('div', 'Loading...', {id: 'popOverContent'});

        // append to inner container
        innerContainer.appendChild(closeCross);
        innerContainer.appendChild(headerElement);
        innerContainer.appendChild(contentContainer);

        this.hide = () => {
            this.initButtons();
            this.container.style.pointerEvents = 'none';
            this.container.style.opacity = 0;
        };

        // append to main container
        this.container.appendChild(closeOverlay);
        this.container.appendChild(innerContainer);
    }

    /**
     *
     * @param header
     * @param data
     */
    update(header = '', data = '') {

        if(!this.container) {
            this.generate();
        }

        let innerContainer = document.getElementById('popOverInner');
        if(header) {
            innerContainer.getElementsByTagName('h2')[0].innerHTML = header;
        }

        let contentContainer = document.getElementById('popOverContent');
        while (contentContainer.firstChild) {
            contentContainer.firstChild.remove();
        }

        if(typeof data === 'string') {
            contentContainer.innerHTML = data;
        } else {
            contentContainer.appendChild(data);
        }

        // show
        this.container.style.pointerEvents = 'auto';
        this.container.style.opacity = 1;
    }

    /**
     *
     */
    initButtons() {
        Popover.removeButtons();
        this.addButton('Ok', this.hide);
    }

    /**
     *
     * @param buttons
     */
    setButtons(buttons = {}) {
        Popover.removeButtons();
        if(Object.keys(buttons).length > 0) {
            for(let key in buttons) {
                if(buttons.hasOwnProperty(key)) {
                    this.addButton(key, buttons[key]);
                }
            }
        }
    }

    /**
     *
     * @param value
     * @param callback
     */
    addButton(value = 'Button', callback) {
        let innerContainer = document.getElementById('popOverInner');

        let button = HtmlGenerator.createTagElement('a', value, {href: '#'});
        button.setAttribute('data-type', 'button');
        button.onclick = (event) => {
            event.preventDefault();
            callback();
        };
        innerContainer.appendChild(button);
    }

    /**
     *
     */
    static removeButtons() {
        let innerContainer = document.getElementById('popOverInner');
        let buttons = innerContainer.querySelectorAll('a[data-type=button]');
        buttons.forEach(function(elem, index) {
            elem.remove();
        });
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
        if(typeof data === 'object' && 'package_information' in data && typeof data.package_information === 'object') {
            for(let pkg of data.package_information) {
                output += '<br><br>';
                output += OutputDecorator.translate('package_information_tracking_number') + ': <b>' + pkg.tracking_number + '</b><br>';
                output += OutputDecorator.translate('package_information_status_date') + ': <b>' + pkg.status_date + '</b><br>';
                output += OutputDecorator.translate('package_information_shipping_carrier') + ': <b>' + pkg.shipping_carrier + '</b><br>';
                output += OutputDecorator.translate('package_information_status_text') + ':<br><b>' + pkg.status_text + '</b>';
            }
        }
        return output ? output : 'Nichts gefunden.';
    }

    /**
     *
     * @param data
     * @returns {string}
     */
    static getUserData(data) {
        let output = '';
        if(typeof data === 'string') {
            output += data;
        }
        let userData = '';
        if(typeof data === 'object' && 'data' in data && typeof data.data === 'object') {
            userData = data.data;
        }
        if(typeof userData === 'object' && 'company' in userData && typeof userData.company === 'object') {
            output += OutputDecorator.translate('company_number') + ': <b>' + userData.company.company_number + '</b><br>';
            output += OutputDecorator.translate('company_name') + ': <b>' + userData.company.company_name + '</b>';
        }
        if(typeof userData === 'object') {
            output += '<br><br>';
            output += OutputDecorator.translate('user_name') + ': <b>' + (userData.name ? userData.name : '-')  + '</b><br>';
            output += OutputDecorator.translate('user_email') + ': <b>' + (userData.email ? userData.email : '-') + '</b><br>';
            output += OutputDecorator.translate('user_has_editing_rights') + ': <b>' + (userData.has_editing_rights ? 'ja' : 'nein') + '</b><br>';
            output += OutputDecorator.translate('user_role') + ': <b>' + userData.role + '</b><br>';
            output += OutputDecorator.translate('user_deactivated_at') + ': <b>' + (userData.deactivated_at ? 'ja' : 'nein') + '</b>';
        }
        return output ? output : 'Nichts gefunden.';
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
            package_information_status_text: 'Letzter Status',
            company_number: 'Kundennummer',
            company_name: 'Kundenname',
            user_name: 'Benutzername',
            user_email: 'E-Mail-Adresse',
            user_has_editing_rights: 'Benutzerverwaltung',
            user_role: 'Benutzerrolle',
            user_deactivated_at: 'Gesperrt'
        };
        if(key in translates) {
            return translates[key];
        }
        return key;
    }
}
