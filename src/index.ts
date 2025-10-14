if (!globalThis['XMLHttpRequest']) {
  type Callback = Function;

  class ProgressEvent {
    public type: string;

    constructor(type: string) {
      this.type = type;
    }
  }

  class XMLHttpRequest {
    static UNSENT = 0;
    static OPENED = 1;
    static HEADERS_RECEIVED = 2;
    static LOADING = 3;
    static DONE = 4;

    public readyState: number = XMLHttpRequest.UNSENT;
    public withCredentials?: boolean = undefined;

    // request info
    public timeout: number = 0;
    private _events: { [name: string]: Callback } = {};
    private _headers: { [name: string]: string } = {};
    private _method: string | undefined = undefined;
    private _url: string | undefined = undefined;
    private _aborted: boolean = false;

    // response info
    public headers: { [name: string]: string } = {};
    public allHeaders: string = "";
    public statusText: string = "";
    public status: number = 0;
    public response: any = "";

    constructor() { }

    set ontimeout(cb: Callback) { this._events['timeout'] = cb; }
    get ontimeout() { return this._events['timeout']; }

    set onloadstart(cb: Callback) { this._events['loadstart'] = cb; }
    get onloadstart() { return this._events['loadstart']; }

    set onloadend(cb: Callback) { this._events['loadend'] = cb; }
    get onloadend() { return this._events['loadend']; }

    set onload(cb: Callback) { this._events['load'] = cb; }
    get onload() { return this._events['load']; }

    set onerror(cb: Callback) { this._events['error'] = cb; }
    get onerror() { return this._events['error']; }

    set onabort(cb: Callback) { this._events['abort'] = cb; }
    get onabort() { return this._events['abort']; }

    addEventListener(event: string, callback: Callback) {
      this._events[event] = callback;
    }

    _trigger(name: string, arg?: any) {
      const handler = this._events[name];
      if (typeof handler === 'function') {
        try { handler.call(this, arg); } catch { }
      }
    }

    setRequestHeader(name: string, value: string) {
      this._headers[name] = value;
    }

    getAllResponseHeaders() {
      return this.allHeaders;
    }

    open(method: string, url: string) {
      this._method = method;
      this._url = url;
      this.readyState = XMLHttpRequest.OPENED;
      this._trigger('readystatechange');
    }

    async send(body?: string) {
      if (this._aborted) return;
      const e = new ProgressEvent('loadstart');
      this._trigger('loadstart', e);
      this.readyState = XMLHttpRequest.LOADING;
      this._trigger('readystatechange');

      const options: RequestInit = {
        method: this._method,
        headers: this._headers,
        body
      };
      if (this.withCredentials) options.credentials = "include";

      try {
        const response = await fetch(this._url!, options);

        if (this._aborted) return;

        let text, headers: { [key: string]: string } = {}, status = 200, statusText = "OK";
        if (typeof response === 'string') {
          text = response;
        } else {
          response.headers.forEach((value, key) => {
            headers[key] = value;
          });
          this.allHeaders = Object.entries(headers)
            .map(([k, v]) => `${k}: ${v}\r\n`).join('');
          status = response.status ?? 200;
          statusText = response.statusText ?? "OK";
          text = await (response.text?.() ?? Promise.resolve(''));
        }

        if (this._aborted) return;

        this.headers = headers;
        this.status = status;
        this.statusText = statusText;
        this.response = text;
        this.readyState = XMLHttpRequest.DONE;
        this._trigger('readystatechange');
        this._trigger('load', new ProgressEvent('load'));
      } catch (reason) {
        if (this._aborted) return;
        this.readyState = XMLHttpRequest.DONE;
        this._trigger('readystatechange');
        this._trigger('error', reason);
      } finally {
        this._trigger('loadend', new ProgressEvent('loadend'));
      }
    }

    abort() {
      if (this._aborted) return;
      this._aborted = true;

      this.readyState = XMLHttpRequest.UNSENT;
      this.status = 0;
      this.statusText = "";
      this.response = "";

      this._trigger('abort', new ProgressEvent('abort'));
      this._trigger('loadend', new ProgressEvent('loadend'));
    }

  }

  // @ts-ignore
  globalThis['XMLHttpRequest'] = XMLHttpRequest;
}
