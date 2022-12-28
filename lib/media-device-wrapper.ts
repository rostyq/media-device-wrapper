export interface EventMap {
  open: undefined,
  update: undefined,
  close: undefined,
}

export interface Handler<T> {
  (this: MediaWrapper<T>): void;
}

export class MediaWrapper<T> {
  private _constraints: T | undefined;

  private _stream: MediaStream | null;
  private _videoTrack: MediaStreamTrack | null;
  private _audioTrack: MediaStreamTrack | null;

  private _ontrackended: () => void;
  private _handlers: Map<keyof EventMap, Map<Handler<T>, boolean>>;

  constructor(constraints?: T) {
    this._constraints = constraints;

    this._stream = null;
    this._videoTrack = null;
    this._audioTrack = null;

    this._ontrackended = () => {
      if (this._stream) {
        this._stream = null;
        this.dispatch("close");
      }
    };
    this._handlers = new Map();
  }

  public on<E extends keyof EventMap>(type: E, handler: Handler<T>, once?: boolean | null) {
    const handlers = this._handlers.get(type);
    if (handlers) handlers.set(handler, !!once);
    else this._handlers.set(type, new Map([[handler, !!once]]));
  }

  public off<E extends keyof EventMap>(type: E, handler: Handler<T>) {
    const handlers = this._handlers.get(type);
    if (handlers) handlers.delete(handler);
  }

  private dispatch<E extends keyof EventMap>(type: E) {
    const handlers = this._handlers.get(type);

    if (handlers) {
      const onetimers: Array<Handler<T>> = [];

      for (const [ listener, once ] of handlers.entries()) {

        try {
          listener.call(this);
        } catch (error) {
          setTimeout(() => { throw error });
        }

        if (once) {
          onetimers.push(listener);
        }
      }

      for (const handler of onetimers) {
        handlers.delete(handler);
      }
    }
  }

  set stream(value: MediaStream | null) {
    this.close();
    if (value) {
      this._stream = value;
      this._setup();
      this.dispatch("open");
    }
  }

  get stream() {
    return this._stream;
  }

  get constraints() {
    return this._constraints;
  }

  get videoSettings() {
    return this._videoTrack?.getSettings();
  }

  get audioSettings() {
    return this._audioTrack?.getSettings();
  }

  get videoTrack() {
    return this._videoTrack;
  }

  get audioTrack() {
    return this._audioTrack;
  }

  public close() {
    if (this._stream) {
      this._stopTracks();
      this._stream = null;

      this._videoTrack = null;
      this._audioTrack = null;

      this.dispatch("close");
    }
  }

  public async applyConstraints(
    constraints: {
      video?: Partial<MediaTrackConstraints>,
      audio?: Partial<MediaTrackConstraints>
    }
  ) {
    await Promise.all([
      constraints.video && this.applyVideoConstraints(constraints.video),
      constraints.audio && this.applyAudioConstraints(constraints.audio),
    ]);
  }

  public async applyVideoConstraints(
    constraints?: Partial<MediaTrackConstraints>,
  ) {
    await this._videoTrack?.applyConstraints(constraints);
    this.dispatch("update");
  }
  public async applyAudioConstraints(
    constraints?: Partial<MediaTrackConstraints>,
  ) {
    await this._audioTrack?.applyConstraints(constraints);
    this.dispatch("update");
  }

  private _setup() {
    const videoTracks = this._stream!.getVideoTracks();
    if (videoTracks.length > 0) {
      this._videoTrack = videoTracks[0];
      this._videoTrack.addEventListener("ended", this._ontrackended, { once: true });
    }

    const audioTracks = this._stream!.getAudioTracks();
    if (audioTracks.length > 0) {
      this._audioTrack = audioTracks[0];
      this._audioTrack.addEventListener("ended", this._ontrackended, { once: true });
    }
  }

  private _stopTracks() {
    this._stream?.getTracks().forEach(track => {
      track.removeEventListener("ended", this._ontrackended);
      track.stop();
    });
  }
}

export class UserMediaWrapper extends MediaWrapper<MediaStreamConstraints> {
  async open() {
    this.stream = await navigator.mediaDevices.getUserMedia(this.constraints);
  }
}

export class DisplayMediaWrapper extends MediaWrapper<MediaStreamConstraints> {
  async open() {
    this.stream = await navigator.mediaDevices.getDisplayMedia(this.constraints);
  }
}