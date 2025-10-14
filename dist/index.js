"use strict";
if (!globalThis['XMLHttpRequest']) {
    class ProgressEvent {
        constructor(type) {
            this.type = type;
        }
    }
    class XMLHttpRequest {
        constructor() {
            this.readyState = XMLHttpRequest.UNSENT;
            this.withCredentials = undefined;
            this.timeout = 0;
            this._events = {};
            this._headers = {};
            this._method = undefined;
            this._url = undefined;
            this._aborted = false;
            this.headers = {};
            this.allHeaders = "";
            this.statusText = "";
            this.status = 0;
            this.response = "";
        }
        set ontimeout(cb) { this._events['timeout'] = cb; }
        get ontimeout() { return this._events['timeout']; }
        set onloadstart(cb) { this._events['loadstart'] = cb; }
        get onloadstart() { return this._events['loadstart']; }
        set onloadend(cb) { this._events['loadend'] = cb; }
        get onloadend() { return this._events['loadend']; }
        set onload(cb) { this._events['load'] = cb; }
        get onload() { return this._events['load']; }
        set onerror(cb) { this._events['error'] = cb; }
        get onerror() { return this._events['error']; }
        set onabort(cb) { this._events['abort'] = cb; }
        get onabort() { return this._events['abort']; }
        addEventListener(event, callback) {
            this._events[event] = callback;
        }
        _trigger(name, arg) {
            const handler = this._events[name];
            if (typeof handler === 'function') {
                try {
                    handler.call(this, arg);
                }
                catch { }
            }
        }
        setRequestHeader(name, value) {
            this._headers[name] = value;
        }
        getAllResponseHeaders() {
            return this.allHeaders;
        }
        open(method, url) {
            this._method = method;
            this._url = url;
            this.readyState = XMLHttpRequest.OPENED;
            this._trigger('readystatechange');
        }
        async send(body) {
            if (this._aborted)
                return;
            const e = new ProgressEvent('loadstart');
            this._trigger('loadstart', e);
            this.readyState = XMLHttpRequest.LOADING;
            this._trigger('readystatechange');
            const options = {
                method: this._method,
                headers: this._headers,
                body
            };
            if (this.withCredentials)
                options.credentials = "include";
            try {
                const response = await fetch(this._url, options);
                if (this._aborted)
                    return;
                let text, headers = {}, status = 200, statusText = "OK";
                if (typeof response === 'string') {
                    text = response;
                }
                else {
                    response.headers.forEach((value, key) => {
                        headers[key] = value;
                    });
                    this.allHeaders = Object.entries(headers)
                        .map(([k, v]) => `${k}: ${v}\r\n`).join('');
                    status = response.status ?? 200;
                    statusText = response.statusText ?? "OK";
                    text = await (response.text?.() ?? Promise.resolve(''));
                }
                if (this._aborted)
                    return;
                this.headers = headers;
                this.status = status;
                this.statusText = statusText;
                this.response = text;
                this.readyState = XMLHttpRequest.DONE;
                this._trigger('readystatechange');
                this._trigger('load', new ProgressEvent('load'));
            }
            catch (reason) {
                if (this._aborted)
                    return;
                this.readyState = XMLHttpRequest.DONE;
                this._trigger('readystatechange');
                this._trigger('error', reason);
            }
            finally {
                this._trigger('loadend', new ProgressEvent('loadend'));
            }
        }
        abort() {
            if (this._aborted)
                return;
            this._aborted = true;
            this.readyState = XMLHttpRequest.UNSENT;
            this.status = 0;
            this.statusText = "";
            this.response = "";
            this._trigger('abort', new ProgressEvent('abort'));
            this._trigger('loadend', new ProgressEvent('loadend'));
        }
    }
    XMLHttpRequest.UNSENT = 0;
    XMLHttpRequest.OPENED = 1;
    XMLHttpRequest.HEADERS_RECEIVED = 2;
    XMLHttpRequest.LOADING = 3;
    XMLHttpRequest.DONE = 4;
    globalThis['XMLHttpRequest'] = XMLHttpRequest;
}
